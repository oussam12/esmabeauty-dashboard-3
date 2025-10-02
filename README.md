# Asmabeauty Dashboard (Next.js + Netlify)

Version neutre sans code couleur ni logo. UI minimale, toutes fonctionnalités incluses (prestations, dépenses, KPI, graphiques, export CSV, récurrence, filtres).

## Démarrer
```bash
npm i
npm run dev
```

## Déployer sur Netlify
- Connecter le repo à Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Plugin: `@netlify/plugin-nextjs` (déjà configuré via `netlify.toml`)
- Node: 18 (forcé via `netlify.toml`)

## Structure
- `app/page.jsx` : page Next qui charge le dashboard côté client
- `components/AsmabeautyDashboard.jsx` : composant principal
- `components/ui/*` : composants UI minimaux (sans shadcn), sans couleurs
