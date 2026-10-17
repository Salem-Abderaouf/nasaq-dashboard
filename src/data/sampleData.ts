import { Client, DoorProduct, Prospect, Worker } from '../types/database';

export const SAMPLE_PRODUCTS: Omit<DoorProduct, 'id' | 'created_at'>[] = [
  {
    reference: 'C1',
    name: 'Chambre Contemporaine — Prisme',
    category: 'Bedroom',
    height: 210,
    width: 90,
    thickness: 4,
    description: 'Porte d\'intérieur WPC avec usinage géométrique diamant et finitions bois naturel.',
    drawing_url: null
  },
  {
    reference: 'C2',
    name: 'Chambre Classique — 4 Lignes',
    category: 'Bedroom',
    height: 212,
    width: 88,
    thickness: 4,
    description: 'Modèle avec 4 lignes horizontales gravées CNC, idéal pour suites et chambres.',
    drawing_url: null
  },
  {
    reference: 'K1',
    name: 'Cuisine Moderne — Oculi Vitré',
    category: 'Kitchen',
    height: 215,
    width: 85,
    thickness: 4,
    description: 'Porte de cuisine avec panneau vitré vertical et verre trempé dépoli.',
    drawing_url: null
  },
  {
    reference: 'K2',
    name: 'Cuisine Prestige — Double Vantaux',
    category: 'Kitchen',
    height: 220,
    width: 120,
    thickness: 4,
    description: 'Grande baie de cuisine à 2 vantaux asymétriques avec oculus.',
    drawing_url: null
  },
  {
    reference: 'B1',
    name: 'Salle de Bain — Étanche Pleine',
    category: 'Bathroom',
    height: 205,
    width: 75,
    thickness: 4,
    description: 'Porte 100% résistante à l\'humidité, imputrescible, isolation phonique renforcée.',
    drawing_url: null
  },
  {
    reference: 'B2',
    name: 'Salle de Bain — Oculi Supérieur Dépoli',
    category: 'Bathroom',
    height: 210,
    width: 75,
    thickness: 4,
    description: 'Modèle sanitaire avec imposte et verre opaque satiné.',
    drawing_url: null
  }
];

export const SAMPLE_CLIENTS: Omit<Client, 'id' | 'created_at'>[] = [
  {
    name: 'Villa Benali — Oran',
    phone: '0550 12 34 56',
    address: 'Résidence Les Pins, Bir El Djir, Oran',
    notes: 'Projet de villa R+2, 21 portes au total.'
  },
  {
    name: 'Promotion Immobilière Al-Manar',
    phone: '0661 78 90 12',
    address: 'Hydra, Alger',
    notes: 'Immeuble de haut standing, demande portes Chêne Foncé.'
  },
  {
    name: 'M. Karim Haddad',
    phone: '0770 45 67 89',
    address: 'Bordj El Kiffan, Alger',
    notes: 'Appartement F4, 6 portes simples et 1 double.'
  },
  {
    name: 'Dr. Amine Mansouri',
    phone: '0560 99 88 77',
    address: 'Ain El Turk, Oran',
    notes: 'Cabinet médical & clinique privée.'
  }
];

export const SAMPLE_PROSPECTS: Omit<Prospect, 'id' | 'created_at'>[] = [
  {
    name: 'Hôtel Le Palmier',
    phone: '0555 11 22 33',
    address: 'Centre Ville, Annaba',
    notes: 'Demande de devis pour 45 portes résistantes à l\'eau pour chambres et suites.',
    status: 'negotiation'
  },
  {
    name: 'M. Youcef Belkacem',
    phone: '0662 33 44 55',
    address: 'Cheraga, Alger',
    notes: 'Intéressé par la couleur Teck Foncé et les poignées noires mat.',
    status: 'interested'
  },
  {
    name: 'Architecte Slimane D.',
    phone: '0771 99 00 11',
    address: 'Boumerdès',
    notes: 'Contact initial pour collaboration sur 3 chantiers résidentiels.',
    status: 'contacted'
  },
  {
    name: 'Complexe Touristique Les Dunes',
    phone: '0540 66 77 88',
    address: 'Mostaganem',
    notes: 'Bungalows en bord de mer, besoin urgent de portes WPC 100% étanches.',
    status: 'new'
  }
];

export const SAMPLE_WORKERS: Omit<Worker, 'id' | 'created_at'>[] = [
  {
    name: 'Rachid Mebarki',
    phone: '0550 44 33 22',
    email: 'rachid.workshop@nasaq.dz',
    position: 'Chef d\'Atelier & Maître Menuisier',
    employment_date: '2024-02-15',
    status: 'active',
    base_salary: 85000,
    payment_day: 5
  },
  {
    name: 'Sofiane Zenati',
    phone: '0661 55 44 33',
    email: 'sofiane.sales@nasaq.dz',
    position: 'Responsable Commercial & Showroom',
    employment_date: '2024-05-01',
    status: 'active',
    base_salary: 75000,
    payment_day: 5
  },
  {
    name: 'Hamza Larbi',
    phone: '0772 88 99 00',
    email: 'hamza.tech@nasaq.dz',
    position: 'Opérateur CNC & Découpe Précision',
    employment_date: '2025-01-10',
    status: 'active',
    base_salary: 62000,
    payment_day: 5
  },
  {
    name: 'Billel Cherif',
    phone: '0561 22 11 00',
    email: 'billel.install@nasaq.dz',
    position: 'Chef d\'Équipe Pose & Installation',
    employment_date: '2025-03-20',
    status: 'active',
    base_salary: 68000,
    payment_day: 5
  }
];
