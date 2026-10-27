# Configurateur vélo — MVP

Configurateur de vélo de route orienté « upgrade » : on part de son vélo actuel, on choisit un objectif
(MVP : passer en Shimano Di2 12v) et le site propose les composants compatibles.

## Lancer

```bash
npm install
npm test        # règles de compatibilité (Vitest)
npm run dev     # http://localhost:3000
```

## Arborescence

| Dossier | Rôle |
|---|---|
| `data/pieces/` | catalogue de pièces (1 JSON par catégorie) |
| `data/velos/` | fiches des modèles de vélos (composants d'origine) |
| `lib/types/` | types des pièces, des vélos et des résultats de compatibilité |
| `lib/compat/regles/` | règles : fonctions pures `configuration → résultat` |
| `lib/compat/tables.ts` | tables officielles (boîtier ↔ axe…) |
| `lib/compat/moteur.ts` | lance toutes les règles, donne le statut global |
| `lib/donnees.ts` | lit automatiquement `data/` (déposer un JSON suffit) |
| `lib/recherche.ts` | recherche par référence gravée (tolère majuscules, espaces, tirets) |
| `lib/upgrade/` | objectifs d'upgrade + calcul de la proposition |
| `lib/prix.ts` | récapitulatif des achats et prix total |
| `app/`, `components/` | interface Next.js en 3 étapes (vélo → pièces → upgrade) |
| `scripts/import/` | (à venir) import des fiches fabricants |

## Statuts

- `compatible` : homologué par le constructeur
- `adaptateur` : marche avec une pièce en plus (précisée)
- `incompatible` : ne marche pas **ou n'est pas homologué par le constructeur**
- `a_verifier` : impossible de trancher, ou fiche pas encore validée à la main

Toutes les fiches du catalogue sont `a_verifier` tant qu'elles n'ont pas été validées : le moteur
n'affiche alors jamais « compatible ».

## Ajouter un objectif d'upgrade

Ajouter une entrée dans `OBJECTIFS` (`lib/upgrade/objectifs.ts`) : les emplacements à remplacer, ceux à
adapter, et la fonction `candidat` qui dit quelles pièces du catalogue conviennent. L'interface le propose
automatiquement à l'étape 3.
