import { UserRole, WorkerPermissions } from './database';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  workerId?: string;
  permissions: WorkerPermissions;
}

export const ADMIN_PERMISSIONS: WorkerPermissions = {
  canViewDashboard: true,
  canViewOrders: true,
  canCreateOrders: true,
  canChangeOrderStatus: true,
  canViewFinancials: true,
  canRecordPayments: true,
  canAccessAtelierCutSheets: true,
  canManageClients: true,
  canManageProspects: true,
  canAccessPayroll: true,
  canExportDocuments: true,
};

export const WORKER_DEFAULT_PERMISSIONS: WorkerPermissions = {
  canViewDashboard: true,
  canViewOrders: true,
  canCreateOrders: false,
  canChangeOrderStatus: true,
  canViewFinancials: false,
  canRecordPayments: false,
  canAccessAtelierCutSheets: true,
  canManageClients: false,
  canManageProspects: false,
  canAccessPayroll: false,
  canExportDocuments: true,
};

export interface PermissionPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  permissions: WorkerPermissions;
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'workshop',
    label: 'Artisan Atelier & Découpe CNC',
    description: 'Accès axé fabrication : fiches de débit atelier, mise à jour des étapes d\'usinage, sans accès aux prix ni à la paie.',
    icon: 'Hammer',
    permissions: {
      canViewDashboard: true,
      canViewOrders: true,
      canCreateOrders: false,
      canChangeOrderStatus: true,
      canViewFinancials: false,
      canRecordPayments: false,
      canAccessAtelierCutSheets: true,
      canManageClients: false,
      canManageProspects: false,
      canAccessPayroll: false,
      canExportDocuments: true,
    }
  },
  {
    id: 'commercial',
    label: 'Commercial & Showroom',
    description: 'Accès vente : création de commandes, configuration 2D, prospection, clients et encaissement d\'acomptes.',
    icon: 'Briefcase',
    permissions: {
      canViewDashboard: true,
      canViewOrders: true,
      canCreateOrders: true,
      canChangeOrderStatus: true,
      canViewFinancials: true,
      canRecordPayments: true,
      canAccessAtelierCutSheets: false,
      canManageClients: true,
      canManageProspects: true,
      canAccessPayroll: false,
      canExportDocuments: true,
    }
  },
  {
    id: 'installer',
    label: 'Poseur & Chantier',
    description: 'Accès chantier : consultation des commandes, validation de livraison/pose et encaissement du solde final sur site.',
    icon: 'Truck',
    permissions: {
      canViewDashboard: false,
      canViewOrders: true,
      canCreateOrders: false,
      canChangeOrderStatus: true,
      canViewFinancials: false,
      canRecordPayments: true,
      canAccessAtelierCutSheets: true,
      canManageClients: true,
      canManageProspects: false,
      canAccessPayroll: false,
      canExportDocuments: false,
    }
  },
  {
    id: 'production_manager',
    label: 'Responsable de Production',
    description: 'Gestion globale d\'atelier : supervision du pipeline, fiches de débit, gestion des statuts de fabrication et clients.',
    icon: 'Factory',
    permissions: {
      canViewDashboard: true,
      canViewOrders: true,
      canCreateOrders: true,
      canChangeOrderStatus: true,
      canViewFinancials: true,
      canRecordPayments: false,
      canAccessAtelierCutSheets: true,
      canManageClients: true,
      canManageProspects: false,
      canAccessPayroll: false,
      canExportDocuments: true,
    }
  },
  {
    id: 'admin',
    label: 'Administrateur Complet',
    description: 'Pouvoirs complets sur l\'entreprise : catalogue, finances, RH & salaires, RLS et gestion des accès.',
    icon: 'ShieldCheck',
    permissions: ADMIN_PERMISSIONS
  }
];
