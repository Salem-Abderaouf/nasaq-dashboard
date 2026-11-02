import { SalaryAdvance, SalaryBonus, SalaryDeduction, Worker, WorkerAppCredentials } from '../../types/database';
import { SupabaseClient } from '@supabase/supabase-js';

const META_TAG_REGEX = /<!--\s*NASAQ_CREDS:([\s\S]*?)\s*-->/;

/**
 * Parses worker application credentials from worker.notes or login_credentials
 */
export function parseWorkerCredentials(worker: Partial<Worker>): WorkerAppCredentials | null {
  if (worker.login_credentials) return worker.login_credentials;
  const notes = worker.notes || '';
  const match = notes.match(META_TAG_REGEX);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.login_email) return parsed as WorkerAppCredentials;
    } catch (e) {
      console.warn('Could not parse NASAQ worker credentials from notes:', e);
    }
  }
  return null;
}

/**
 * Serializes worker notes and credentials for persistent database storage
 */
export function serializeWorkerNotes(notes: string | undefined | null, creds: WorkerAppCredentials): string {
  const cleanNotes = (notes || '').replace(META_TAG_REGEX, '').trim();
  const payload = JSON.stringify(creds);
  return `${cleanNotes ? cleanNotes + '\n\n' : ''}<!-- NASAQ_CREDS:${payload} -->`.trim();
}

/**
 * Returns clean notes without internal credentials metadata tag
 */
export function extractCleanWorkerNotes(notes: string | undefined | null): string {
  return (notes || '').replace(META_TAG_REGEX, '').trim();
}

/**
 * Computes net salary for an employee according to Section 7.4 of business.md:
 * Final Disbursement = max(Base Salary + Bonuses - Deductions - Unsettled Advances, 0)
 */
export function calculateNetSalary(
  baseSalary: number,
  bonuses: SalaryBonus[],
  deductions: SalaryDeduction[],
  advances: SalaryAdvance[]
): number {
  const currentBase = Number(baseSalary || 0);
  const totalBon = calculateTotalBonuses(bonuses);
  const totalDed = calculateTotalDeductions(deductions);
  const totalAdv = calculateUnsettledAdvances(advances);

  return Math.max(0, currentBase + totalBon - totalDed - totalAdv);
}

export function calculateTotalBonuses(bonuses: SalaryBonus[]): number {
  return (bonuses || []).reduce((acc, b) => acc + Number(b.amount || 0), 0);
}

export function calculateTotalDeductions(deductions: SalaryDeduction[]): number {
  return (deductions || []).reduce((acc, d) => acc + Number(d.amount || 0), 0);
}

export function calculateUnsettledAdvances(advances: SalaryAdvance[]): number {
  return (advances || [])
    .filter(a => !a.is_settled)
    .reduce((acc, a) => acc + Number(a.amount || 0), 0);
}

/**
 * Generate secure random uppercase alphanumeric password
 */
export function generateRandomPassword(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Deletes all related child records before deleting the worker row
 */
export async function deleteWorkerCascade(supabase: SupabaseClient, workerId: string) {
  // 1. Delete associated salary advances
  await supabase.from('salary_advances').delete().eq('worker_id', workerId);

  // 2. Delete associated salary bonuses
  await supabase.from('salary_bonuses').delete().eq('worker_id', workerId);

  // 3. Delete associated salary deductions
  await supabase.from('salary_deductions').delete().eq('worker_id', workerId);

  // 4. Delete associated salary payments
  await supabase.from('salary_payments').delete().eq('worker_id', workerId);

  // 5. Unlink worker from any orders
  await supabase.from('orders').update({ worker_id: null }).eq('worker_id', workerId);

  // 6. Delete the worker record
  const { error } = await supabase.from('workers').delete().eq('id', workerId);
  if (error) throw error;
}
