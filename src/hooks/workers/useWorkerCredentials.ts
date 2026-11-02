import { useState, useCallback } from 'react';
import { Worker, WorkerAppCredentials, WorkerPermissions } from '../../types/database';
import { PERMISSION_PRESETS } from '../../types/auth';
import { AuthService } from '../../services/authService';
import { generateRandomPassword, parseWorkerCredentials } from '../../helpers/workers/payrollHelpers';

export function useWorkerCredentials(
  worker: Worker,
  onClose: () => void,
  onSaved: (credentials: WorkerAppCredentials) => void
) {
  const existingCreds = parseWorkerCredentials(worker) || AuthService.getWorkerCredentials(worker.email || worker.id);

  const [enabled, setEnabled] = useState<boolean>(
    existingCreds ? existingCreds.app_access_enabled : true
  );

  const [loginEmail, setLoginEmail] = useState<string>(
    existingCreds?.login_email || worker.email || `${worker.name.toLowerCase().replace(/\s+/g, '.')}@nasaq.dz`
  );

  const [password, setPassword] = useState<string>(
    existingCreds?.password || 'worker123'
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Initialize permissions
  const [permissions, setPermissions] = useState<WorkerPermissions>(() => {
    if (existingCreds?.permissions) {
      return existingCreds.permissions;
    }
    const pos = (worker.position || '').toLowerCase();
    if (pos.includes('commercial') || pos.includes('vente')) {
      return PERMISSION_PRESETS.find(p => p.id === 'commercial')!.permissions;
    }
    if (pos.includes('pose') || pos.includes('install')) {
      return PERMISSION_PRESETS.find(p => p.id === 'installer')!.permissions;
    }
    return PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions;
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = PERMISSION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPermissions({ ...preset.permissions });
      setSelectedPresetId(presetId);
    }
  }, []);

  const handleTogglePermission = useCallback((key: keyof WorkerPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSelectedPresetId(null);
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const pwd = generateRandomPassword(6);
    setPassword(pwd);
    setShowPassword(true);
  }, []);

  const handleSubmit = useCallback((
    e: React.FormEvent,
    onValidationError?: (msg: string) => void,
    onError?: (msg: string) => void
  ) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      onValidationError?.('Veuillez renseigner un email ou identifiant valide.');
      return;
    }

    setSaving(true);
    try {
      const updatedCreds: WorkerAppCredentials = {
        login_email: loginEmail.trim().toLowerCase(),
        password: password.trim(),
        app_access_enabled: enabled,
        permissions: permissions,
        last_login: existingCreds?.last_login || null
      };

      AuthService.saveWorkerCredentials(worker, updatedCreds);
      onSaved(updatedCreds);
      onClose();
    } catch (err: any) {
      onError?.(err.message || 'Erreur lors de l\'enregistrement des accès.');
    } finally {
      setSaving(false);
    }
  }, [loginEmail, password, enabled, permissions, existingCreds, worker, onSaved, onClose]);

  return {
    enabled,
    setEnabled,
    loginEmail,
    setLoginEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    permissions,
    selectedPresetId,
    saving,
    handleApplyPreset,
    handleTogglePermission,
    handleGeneratePassword,
    handleSubmit
  };
}
