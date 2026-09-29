# SyGeDoc-IR — Gestion des réclamations Moov Africa

Application web de gestion des réclamations clients pour Moov Africa Burkina Faso : enregistrement, suivi, affectation aux agents, statistiques et suivi des délais SLA.

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Base de données | SQLite (via Prisma ORM) |
| Authentification | JWT (JSON Web Token) |
| Graphiques | Recharts |

## Fonctionnalités

- **Authentification** avec rôles `ADMIN` / `AGENT` (JWT, contrôle d'accès aux endpoints sensibles)
- **Réclamations** : création, suivi de statut (Nouveau → En cours → Résolu), historique des changements, commentaires internes, pièces jointes
- **Affectation** des réclamations à un agent, avec notification automatique
- **Suivi SLA** : délai de traitement calculé automatiquement par catégorie, statut dérivé (dans les temps / à risque / dépassé / respecté)
- **Recherche, filtres et pagination** sur les listes de réclamations et d'utilisateurs
- **Statistiques** : tableau de bord avec répartition par catégorie, évolution sur 7 jours, délai moyen de résolution, réclamations en retard SLA
- **Export** des réclamations en CSV et PDF
- **Gestion des utilisateurs et catégories** (réservée aux administrateurs), avec réinitialisation de mot de passe

## Prérequis

- Node.js 18+
- npm

## Installation

```bash
npm run install:all
```

Installe les dépendances à la racine, dans `backend/` et dans `frontend/`.

## Configuration

Le backend a besoin d'un fichier `.env` dans `backend/` (voir `backend/.env.example`) :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="<une chaîne aléatoire longue et secrète>"
```

Générer un secret sûr, par exemple :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Base de données

Depuis `backend/` :

```bash
npx prisma migrate dev   # applique les migrations et crée dev.db
npx prisma db seed       # crée le compte administrateur et les catégories par défaut
```

Compte admin par défaut créé par le seed : `admin@moov.africa` / `admin123`.

## Lancer le projet en développement

Depuis la racine :

```bash
npm run dev
```

Démarre en parallèle :
- le backend NestJS sur `http://localhost:3000`
- le frontend Vite sur `http://localhost:5173`

## Structure du projet

```
reclamations-ir/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── auth/         # authentification JWT, guards de rôles
│   │   ├── users/        # gestion des utilisateurs
│   │   ├── categories/   # catégories de réclamations
│   │   ├── complaints/   # réclamations, SLA, export CSV/PDF
│   │   ├── statistics/   # agrégats pour le tableau de bord
│   │   └── notifications/
│   └── prisma/
│       └── schema.prisma
└── frontend/         # SPA React
    └── src/
        ├── pages/
        ├── layouts/
        └── lib/
```

## Tests

```bash
cd backend
npm test
```
