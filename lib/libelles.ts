// Libellés de l'interface.

import type { Emplacement, Statut } from "@/lib/types";

/** Lignes de l'étape 2, dans l'ordre d'affichage. */
export const EMPLACEMENTS_A_VERIFIER: Emplacement[] = [
  "cadre",
  "roues",
  "manettes",
  "derailleur_arriere",
  "derailleur_avant",
  "pedalier",
  "boitier",
  "cassette",
  "chaine",
  "etriers",
  "electronique",
];

export const NOM_EMPLACEMENT: Record<Emplacement, string> = {
  cadre: "Cadre",
  roues: "Roues",
  pedalier: "Pédalier",
  boitier: "Boîtier de pédalier",
  cassette: "Cassette",
  chaine: "Chaîne",
  derailleur_arriere: "Dérailleur arrière",
  derailleur_avant: "Dérailleur avant",
  manettes: "Manettes",
  electronique: "Électronique (batterie, câbles)",
  etriers: "Étriers de frein",
  disques: "Disques",
  pneus: "Pneus",
  cintre: "Cintre",
  potence: "Potence",
  tige_selle: "Tige de selle",
};

export const LIBELLE_STATUT: Record<Statut, string> = {
  compatible: "Compatible",
  adaptateur: "Adaptateur",
  incompatible: "Incompatible",
  a_verifier: "À vérifier",
};

export const ICONE_STATUT: Record<Statut, string> = {
  compatible: "✓",
  adaptateur: "⚠",
  incompatible: "✗",
  a_verifier: "?",
};
