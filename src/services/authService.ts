import { supabase } from '../api/supabase';
import { Worker, WorkerAppCredentials, WorkerPermissions } from '../types/database';
import { AuthenticatedUser, ADMIN_PERMISSIONS, PERMISSION_PRESETS } from '../types/auth';

const STORAGE_KEY_AUTH_USER = 'nasaq_auth_active_user';
const STORAGE_KEY_WORKER_ACCOUNTS = 'nasaq_worker_credentials_db';

// Pre-configured default worker accounts for quick testing & initial setup
const DEFAULT_WORKER_ACCOUNTS: Record<string, WorkerAppCredentials> = {
  // Rachid Mebarki (Chef d'Atelier)
  'rachid.workshop@nasaq.dz': {
    login_email: 'rachid.workshop@nasaq.dz',
    password: 'rachid123',
    app_access_enabled: true,
    permissions: PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions,
    last_login: null
  },
  // Sofiane Zenati (Commercial Showroom)
  'sofiane.sales@nasaq.dz': {
    login_email: 'sofiane.sales@nasaq.dz',
    password: 'sofiane123',
    app_access_enabled: true,
    permissions: PERMISSION_PRESETS.find(p => p.id === 'commercial')!.permissions,
    last_login: null
  },
  // Hamza Larbi (Opérateur CNC)
  'hamza.tech@nasaq.dz': {
    login_email: 'hamza.tech@nasaq.dz',
    password: 'hamza123',
    app_access_enabled: true,
    permissions: PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions,
    last_login: null
  },
  // Billel Cherif (Poseur)
  'billel.install@nasaq.dz': {
    login_email: 'billel.install@nasaq.dz',
    password: 'billel123',
    app_access_enabled: true,
    permissions: PERMISSION_PRESETS.find(p => p.id === 'installer')!.permissions,
    last_login: null
  }
};

export class AuthService {
  /**
   * Retrieve all saved worker credentials mapped by worker email or ID
   */
  static getStoredWorkerAccounts(): Record<string, WorkerAppCredentials> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_WORKER_ACCOUNTS);
      if (!data) {
        // Initialize with default worker accounts
        localStorage.setItem(STORAGE_KEY_WORKER_ACCOUNTS, JSON.stringify(DEFAULT_WORKER_ACCOUNTS));
        return DEFAULT_WORKER_ACCOUNTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_WORKER_ACCOUNTS;
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
   * Save or update credentials and permissions for a worker
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

    localStorage.setItem(STORAGE_KEY_WORKER_ACCOUNTS, JSON.stringify(accounts));

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
   * Retrieve active session user
   */
  static getCurrentUser(): AuthenticatedUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persist active session user
   */
  static setCurrentUser(user: AuthenticatedUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
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

    // 1. Check Master Admin Credentials
    const isAdminAccount = 
      cleanId === 'admin@nasaq.com' || 
      cleanId === 'admin' || 
      cleanId === 'direction@nasaq.com';

    if (isAdminAccount && (cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === 'Password123!')) {
      const adminUser: AuthenticatedUser = {
        id: 'admin-master-id',
        name: 'Direction Générale NASAQ',
        email: 'direction@nasaq.com',
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

        const role = userProfile?.role || 'worker';
        const user: AuthenticatedUser = {
          id: supaAuth.user.id,
          name: userProfile?.name || supaAuth.user.email?.split('@')[0] || 'Utilisateur',
          email: supaAuth.user.email || cleanId,
          role: role,
          position: role === 'admin' ? 'Administrateur' : 'Collaborateur',
          permissions: role === 'admin' ? ADMIN_PERMISSIONS : PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions
        };
        this.setCurrentUser(user);
        return { success: true, user };
      }
    } catch {
      // Continue to local worker check if Supabase error (e.g. unconfirmed email or offline)
    }

    // 3. Check Worker App Credentials configured by Admin
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
          error: 'Accès désactivé : L\'administrateur a suspendu la connexion de ce compte employé.'
        };
      }

      // Check password
      if (matchedCreds.password && matchedCreds.password !== cleanPass) {
        return { success: false, error: 'Mot de passe ou code PIN incorrect.' };
      }

      // Find worker name and position if possible
      let workerName = cleanId.split('@')[0].toUpperCase();
      let workerPosition = 'Artisan Menuisier WPC';

      if (cleanId.includes('rachid')) {
        workerName = 'Rachid Mebarki';
        workerPosition = 'Chef d\'Atelier & Maître Menuisier';
      } else if (cleanId.includes('sofiane')) {
        workerName = 'Sofiane Zenati';
        workerPosition = 'Responsable Commercial & Showroom';
      } else if (cleanId.includes('hamza')) {
        workerName = 'Hamza Larbi';
        workerPosition = 'Opérateur CNC & Découpe Précision';
      } else if (cleanId.includes('billel')) {
        workerName = 'Billel Cherif';
        workerPosition = 'Chef d\'Équipe Pose & Installation';
      }

      const workerUser: AuthenticatedUser = {
        id: `worker-${cleanId}`,
        name: workerName,
        email: matchedCreds.login_email,
        role: 'worker',
        position: workerPosition,
        permissions: matchedCreds.permissions
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
   * Fast 1-click login for demonstration and switching
   */
  static async quickLogin(roleType: 'admin' | 'workshop' | 'commercial'): Promise<AuthenticatedUser> {
    if (roleType === 'admin') {
      const user: AuthenticatedUser = {
        id: 'admin-master-id',
        name: 'Direction Générale NASAQ',
        email: 'direction@nasaq.com',
        role: 'admin',
        position: 'Administrateur Général',
        permissions: ADMIN_PERMISSIONS
      };
      this.setCurrentUser(user);
      return user;
    }

    if (roleType === 'workshop') {
      const workshopPermissions = PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions;
      const user: AuthenticatedUser = {
        id: 'worker-rachid',
        name: 'Rachid Mebarki',
        email: 'rachid.workshop@nasaq.dz',
        role: 'worker',
        position: 'Chef d\'Atelier & Maître Menuisier',
        permissions: workshopPermissions
      };
      this.setCurrentUser(user);
      return user;
    }

    // Commercial
    const commPermissions = PERMISSION_PRESETS.find(p => p.id === 'commercial')!.permissions;
    const user: AuthenticatedUser = {
      id: 'worker-sofiane',
      name: 'Sofiane Zenati',
      email: 'sofiane.sales@nasaq.dz',
      role: 'worker',
      position: 'Responsable Commercial & Showroom',
      permissions: commPermissions
    };
    this.setCurrentUser(user);
    return user;
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
