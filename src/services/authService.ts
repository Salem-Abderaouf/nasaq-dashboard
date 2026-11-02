import { supabase } from '../api/supabase';
import { Worker, WorkerAppCredentials } from '../types/database';
import { AuthenticatedUser, ADMIN_PERMISSIONS, PERMISSION_PRESETS } from '../types/auth';
import { parseWorkerCredentials, serializeWorkerNotes } from '../helpers/workers/payrollHelpers';

const STORAGE_KEY_AUTH_USER = 'nasaq_auth_active_user';
const STORAGE_KEY_WORKER_ACCOUNTS = 'nasaq_worker_credentials_db';

function getSafeStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

// In-memory or safe storage for worker app accounts
export class AuthService {
  /**
   * Retrieve all saved worker credentials mapped by worker email or ID
   */
  static getStoredWorkerAccounts(): Record<string, WorkerAppCredentials> {
    try {
      const storage = getSafeStorage();
      const data = storage ? storage.getItem(STORAGE_KEY_WORKER_ACCOUNTS) : null;
      if (!data) {
        return {};
      }
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  /**
   * Get credentials for a specific worker by their login email or id
   */
  static getWorkerCredentials(emailOrId: string): WorkerAppCredentials | null {
    const accounts = this.getStoredWorkerAccounts();
    const normalized = emailOrId.trim().toLowerCase();
    
    // Check by email direct key
    if (accounts[normalized]) {
      return accounts[normalized];
    }
    
    // Check by login_email inside
    for (const key of Object.keys(accounts)) {
      if (accounts[key].login_email.toLowerCase() === normalized) {
        return accounts[key];
      }
    }

    return null;
  }

  /**
   * Save or update credentials and permissions for a worker in local cache and Supabase
   */
  static saveWorkerCredentials(worker: Worker, credentials: WorkerAppCredentials): void {
    const accounts = this.getStoredWorkerAccounts();
    const emailKey = credentials.login_email.trim().toLowerCase();
    
    accounts[emailKey] = {
      ...credentials,
      login_email: emailKey
    };

    // Also link by worker.id if available
    if (worker.id) {
      accounts[worker.id] = accounts[emailKey];
    }

    getSafeStorage()?.setItem(STORAGE_KEY_WORKER_ACCOUNTS, JSON.stringify(accounts));

    // Persist to Supabase so worker can log in from any device or in production
    if (worker.id) {
      const updatedNotes = serializeWorkerNotes(worker.notes, credentials);
      worker.notes = updatedNotes;
      supabase
        .from('workers')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', worker.id)
        .then(({ error }) => {
          if (error) console.warn('Could not sync worker credentials to Supabase:', error);
        });
    }

    // If currently logged in as this worker, update session permissions dynamically
    const current = this.getCurrentUser();
    if (current && (current.email.toLowerCase() === emailKey || current.workerId === worker.id)) {
      const updatedUser: AuthenticatedUser = {
        ...current,
        name: worker.name,
        position: worker.position,
        permissions: credentials.permissions
      };
      this.setCurrentUser(updatedUser);
    }
  }

  /**
   * Delete stored credentials and access permissions for a worker
   */
  static deleteWorkerCredentials(worker: Worker): void {
    try {
      const accounts = this.getStoredWorkerAccounts();
      const emailKey = worker.email ? worker.email.trim().toLowerCase() : '';
      if (emailKey && accounts[emailKey]) {
        delete accounts[emailKey];
      }
      if (worker.id && accounts[worker.id]) {
        delete accounts[worker.id];
      }
      getSafeStorage()?.setItem(STORAGE_KEY_WORKER_ACCOUNTS, JSON.stringify(accounts));
    } catch (err) {
      console.warn('Error deleting worker credentials from local storage:', err);
    }
  }

  /**
   * Retrieve active session user
   */
  static getCurrentUser(): AuthenticatedUser | null {
    try {
      const stored = getSafeStorage()?.getItem(STORAGE_KEY_AUTH_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persist active session user
   */
  static setCurrentUser(user: AuthenticatedUser | null): void {
    const storage = getSafeStorage();
    if (!storage) return;
    if (user) {
      storage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      storage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  }

  /**
   * Main login flow handling Admin, Supabase Auth, and Worker Accounts
   */
  static async login(identifier: string, password: string): Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Veuillez saisir votre identifiant et mot de passe.' };
    }

    // 1. Check Primary Admin Account (Strict single admin check)
    if (cleanId === 'jolylip@gmail.com' && cleanPass === 'Salem*299') {
      const adminUser: AuthenticatedUser = {
        id: 'bb1c76f7-8233-46b8-b471-3611186c189a',
        name: 'Administrateur',
        email: 'jolylip@gmail.com',
        role: 'admin',
        position: 'Administrateur Général',
        permissions: ADMIN_PERMISSIONS
      };
      this.setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }

    // 2. Try Supabase Auth in case account is hosted in Supabase
    try {
      const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
        email: cleanId,
        password: cleanPass
      });

      if (!supaErr && supaAuth.user) {
        // Fetch role from public.users if present
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaAuth.user.id)
          .single();

        const isAdmin = userProfile?.is_admin === true || userProfile?.role === 'admin' || supaAuth.user.email?.toLowerCase() === 'jolylip@gmail.com';
        const role = isAdmin ? 'admin' : (userProfile?.role || 'worker');
        const user: AuthenticatedUser = {
          id: supaAuth.user.id,
          name: userProfile?.name || supaAuth.user.email?.split('@')[0] || 'Utilisateur',
          email: supaAuth.user.email || cleanId,
          role: role,
          position: isAdmin ? 'Administrateur' : 'Collaborateur',
          permissions: isAdmin ? ADMIN_PERMISSIONS : PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions
        };
        this.setCurrentUser(user);
        return { success: true, user };
      }
    } catch {
      // Continue to worker check if Supabase error (e.g. unconfirmed email or offline)
    }

    // 3. Check Workers in Supabase Database (Cross-device & Production support)
    try {
      let dbWorkers: any[] = [];
      const { data: matchedByEmail } = await supabase
        .from('workers')
        .select('*')
        .ilike('email', cleanId);

      if (matchedByEmail && matchedByEmail.length > 0) {
        dbWorkers = matchedByEmail;
      } else {
        const { data: matchedByNotes } = await supabase
          .from('workers')
          .select('*')
          .ilike('notes', `%${cleanId}%`);
        if (matchedByNotes && matchedByNotes.length > 0) {
          dbWorkers = matchedByNotes;
        }
      }

      if (dbWorkers && dbWorkers.length > 0) {
        for (const w of dbWorkers) {
          const creds = parseWorkerCredentials(w) || this.getWorkerCredentials(w.email || cleanId);
          if (creds && creds.login_email.toLowerCase() === cleanId) {
            // Check if Admin disabled app access
            if (!creds.app_access_enabled) {
              return {
                success: false,
                error: 'Accès désactivé : L\'administrateur a suspendu la connexion de ce compte.'
              };
            }

            // Check password
            if (creds.password && creds.password !== cleanPass) {
              return { success: false, error: 'Mot de passe ou code PIN incorrect.' };
            }

            // Cache in localStorage for offline availability
            this.saveWorkerCredentials(w, creds);

            const isWorkerAdmin = w.is_admin === true || creds.is_admin === true;
            const role = isWorkerAdmin ? 'admin' : 'worker';
            const workerUser: AuthenticatedUser = {
              id: w.id,
              name: w.name,
              email: w.email || cleanId,
              role: role,
              position: w.position || (isWorkerAdmin ? 'Administrateur' : 'Artisan Menuisier WPC'),
              workerId: w.id,
              permissions: isWorkerAdmin ? ADMIN_PERMISSIONS : (creds.permissions || PERMISSION_PRESETS[0].permissions)
            };

            this.setCurrentUser(workerUser);
            return { success: true, user: workerUser };
          }
        }
      }
    } catch (err) {
      console.warn('Error verifying worker credentials against Supabase:', err);
    }

    // 4. Check Local Worker App Credentials (Offline / Cached accounts)
    const accounts = this.getStoredWorkerAccounts();
    let matchedCreds: WorkerAppCredentials | null = null;

    for (const key of Object.keys(accounts)) {
      if (accounts[key].login_email.toLowerCase() === cleanId) {
        matchedCreds = accounts[key];
        break;
      }
    }

    if (matchedCreds) {
      // Check if Admin disabled app access for this worker
      if (!matchedCreds.app_access_enabled) {
        return {
          success: false,
          error: 'Accès désactivé : L\'administrateur a suspendu la connexion de ce compte.'
        };
      }

      // Check password
      if (matchedCreds.password && matchedCreds.password !== cleanPass) {
        return { success: false, error: 'Mot de passe ou code PIN incorrect.' };
      }

      const isWorkerAdmin = matchedCreds.is_admin === true;
      const workerUser: AuthenticatedUser = {
        id: `worker-${cleanId}`,
        name: cleanId.split('@')[0],
        email: matchedCreds.login_email,
        role: isWorkerAdmin ? 'admin' : 'worker',
        position: isWorkerAdmin ? 'Administrateur' : 'Collaborateur',
        permissions: isWorkerAdmin ? ADMIN_PERMISSIONS : matchedCreds.permissions
      };

      this.setCurrentUser(workerUser);
      return { success: true, user: workerUser };
    }

    return {
      success: false,
      error: 'Identifiant ou mot de passe introuvable. Veuillez vérifier vos accès ou contacter l\'administrateur.'
    };
  }

  /**
   * Logout session
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {}
    this.setCurrentUser(null);
  }
}
