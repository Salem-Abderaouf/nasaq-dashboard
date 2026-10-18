# NASAQ WPC Doors — Dashboard & Studio de Configuration 2D

Application web moderne développée avec **React 18**, **TypeScript**, **Vite** et **Tailwind CSS**, connectée au projet Supabase **nasaq admin app** (`hqgburjxfuyvyeotmqae`).

---

## 🌟 Fonctionnalités Principales

### 1. Studio de Configuration de Portes WPC (Remplacement & Modernisation du fichier HTML)
- **Dessins 2D Élevations Techniques (CAD)** :
  - Rendu vectoriel SVG à l'échelle précise (paramétrable en px/cm).
  - Portes simples (1 vantail) et portes doubles asymétriques (2 vantaux avec proportion réglable du semi-fixe, ex: 28%).
  - 8 finitions & teintes bois WPC officielles : *Blanc, Biro, Chêne Bois, Chêne Foncé, Gris Foncé, IRAB, Teck Foncé, Vangè*.
  - Motifs décoratifs et gravures CNC réelles : *Prisme Géométrique, Quatre Lignes, Équerre Asymétrique, Cadre Rectangulaire, Pointe/Flèche, Lignes Décalées, ou Lisse*.
  - Imposte / Panneau de revêtement supérieur avec cotes automatiques (+13 000 DA).
  - Vitrages indépendants & oculi configurables (hauteur, largeur, marge supérieure, distance du bord, choix du vantail). Préréglages rapides : *3 Bandes, Étagé, Plein*.
  - Quincaillerie au choix : *Noir Mat* ou *Chrome Brossé*.
- **Facturation Standard & Devis Client** :
  - En-tête officiel NASAQ WPC, coordonnées de l'atelier (+213 660 99 60 97), tableau récapitulatif détaillé.
  - Gestion des prestations complémentaires : *Pose & Installation (5 000 DA simple, 6 000 DA double)* et *Transport / Livraison (3 000 DA forfait)*.
  - Calcul d'acompte et reste à payer.
  - Cadres de signature officiels (Visa Client et Direction Commerciale).
- **Tarif Promotionnel (Devis Promo)** :
  - Calcul dynamique de la remise commerciale, prix initial barré, sous-total remisé et économie globale mise en avant.
- **Fiche Atelier & Débit de Fabrication (Usage Interne)** :
  - **Dépourvue de toute information tarifaire**.
  - Dimensions de débit exactes, usinages CNC, coordonnées de découpe vitrages et cases de contrôle qualité.
- **Exports & Impression** :
  - Export PNG haute définition de chaque planche (Dessins 2D, Facture, Devis Promo, Fiche Atelier) via `html2canvas`.
  - Export du dossier complet en archive ZIP via `jszip` et `file-saver`.
  - Impression A4 optimisée avec styles d'impression dédiés (anti-coupure de pages).

### 2. Intégration Supabase (`hqgburjxfuyvyeotmqae`)
- Enregistrement direct des commandes conçues dans le studio vers les tables `public.orders`, `public.order_items` et `public.order_payments`.
- Recherche et sélection des clients existants depuis Supabase.
- Bouton d'initialisation rapide de données d'exemple (*Initialiser Démo Supabase*).

### 3. Tableau de Bord Exécutif (Dashboard)
- **KPIs en Temps Réel** : Chiffre d'affaires réalisé, volume total facturé, trésorerie encaissée, créances clients restantes, nombre de clients et prospects.
- **Pipeline des Commandes en 9 Étapes** :
  1. `draft` (Brouillon)
  2. `confirmed` (Confirmée)
  3. `manufacturing` (En Fabrication)
  4. `ready_for_dispatch` (Prête pour Expédition)
  5. `in_transit` (En Livraison)
  6. `delivered` (Livrée)
  7. `installation` (En Pose)
  8. `completed` (Terminée)
  9. `cancelled` (Annulée)
- Tableau des commandes récentes avec badges de statut et de paiement (*Payé Intégral, Acompte Versé, Non Payé, Trop-Perçu*).
- Classement des modèles de portes WPC les plus vendus.

### 4. Gestion des Commandes & Règlements
- Filtrage multi-critères (recherche plein texte, statut atelier, état de paiement).
- Fiche détaillée de commande avec aperçu visuel 2D de chaque porte.
- Modal d'encaissement d'acompte/versement avec mise à jour instantanée du solde dans Supabase.
- Audit trail et possibilité d'annuler (void) une transaction erronée.

### 5. CRM & Répertoire Clients
- Fiches clients avec coordonnées et adresses de chantier.
- Relevé financier client (total commandes, total versé, créances en cours, 10 derniers règlements).
- Création directe d'une commande rattachée à un client.

### 6. Pipeline des Prospects & Opportunités
- Tableau Kanban suivant les 6 étapes de négociation : *Nouveau, Contacté, Intéressé, Négociation, Converti, Perdu*.
- Conversion 1-clic d'un prospect en client officiel.

### 7. Catalogue des Modèles de Portes WPC
- Références certifiées NASAQ (Cuisine, Chambre, Bain, Sur-mesure).
- Bouton d'injection des modèles de base (`C1`, `C2`, `K1`, `K2`, `B1`, `B2`).

### 8. Ressources Humaines & Moteur de Paie
- Fiches des collaborateurs et artisans d'atelier.
- Gestion des avances sur salaire, primes de rendement et retenues.
- Calculatrice automatique du salaire net selon la formule métier :
  $$\text{Net à Verser} = \max(\text{Salaire de Base} + \text{Primes} - \text{Retenues} - \text{Avances Non Soldées}, 0)$$

---

## 🚀 Démarrage du Projet (avec Bun)

### Installation des dépendances
```bash
bun install
```

### Lancement du serveur de développement
```bash
bun run dev
```
L'application démarre sur `http://localhost:3000`.

### Compilation de production
```bash
bun run build
```

---

## 🎨 Charte Graphique NASAQ
- **Teal Profond** : `#1c4b46`
- **Dark Teal** : `#123330`
- **Or Sable / Accent** : `#a3895c` / `#c2aa7e`
- **Typographie** : *Cinzel* (Titres & Prestige), *Plus Jakarta Sans* (Interface), *JetBrains Mono* (Cotes & Chiffres).
