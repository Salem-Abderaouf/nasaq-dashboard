import { DoorProduct } from '../types/database';

export const SAMPLE_PRODUCTS: Omit<DoorProduct, 'id' | 'created_at'>[] = [
  {
    reference: 'C1',
    name: 'Chambre Contemporaine — Prisme',
    category: 'Bedroom',
    height: 210,
    width: 90,
    thickness: 4,
    description: 'Porte d\'intérieur WPC avec usinage géométrique diamant et finitions bois naturel.',
    drawing_url: null,
    stock_quantity: 25
  },
  {
    reference: 'C2',
    name: 'Chambre Classique — 4 Lignes',
    category: 'Bedroom',
    height: 212,
    width: 88,
    thickness: 4,
    description: 'Modèle avec 4 lignes horizontales gravées CNC, idéal pour suites et chambres.',
    drawing_url: null,
    stock_quantity: 18
  },
  {
    reference: 'K1',
    name: 'Cuisine Moderne — Oculi Vitré',
    category: 'Kitchen',
    height: 215,
    width: 85,
    thickness: 4,
    description: 'Porte de cuisine avec panneau vitré vertical et verre trempé dépoli.',
    drawing_url: null,
    stock_quantity: 12
  },
  {
    reference: 'K2',
    name: 'Cuisine Prestige — Double Vantaux',
    category: 'Kitchen',
    height: 220,
    width: 120,
    thickness: 4,
    description: 'Grande baie de cuisine à 2 vantaux asymétriques avec oculus.',
    drawing_url: null,
    stock_quantity: 6
  },
  {
    reference: 'B1',
    name: 'Salle de Bain — Étanche Pleine',
    category: 'Bathroom',
    height: 205,
    width: 75,
    thickness: 4,
    description: 'Porte 100% résistante à l\'humidité, imputrescible, isolation phonique renforcée.',
    drawing_url: null,
    stock_quantity: 30
  },
  {
    reference: 'B2',
    name: 'Salle de Bain — Oculi Supérieur Dépoli',
    category: 'Bathroom',
    height: 210,
    width: 75,
    thickness: 4,
    description: 'Modèle sanitaire avec imposte et verre opaque satiné.',
    drawing_url: null,
    stock_quantity: 15
  }
];

