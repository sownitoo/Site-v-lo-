// Tables de compatibilité issues des docs constructeurs.
// On les met à jour ici sans toucher au code des règles.

import type { StandardBoitier } from "@/lib/types";

export interface SolutionBoitier {
  statut: "compatible" | "adaptateur";
  /** Boîtier à monter, en clair */
  boitier: string;
}

/**
 * Standard de boîtier du cadre × diamètre d'axe du pédalier → boîtier à monter.
 * Absent de la table = on ne sait pas trancher (a_verifier).
 */
export const BOITIERS: Partial<Record<StandardBoitier, Partial<Record<number, SolutionBoitier>>>> = {
  bsa: {
    24: { statut: "compatible", boitier: "boîtier BSA pour axe 24 mm (ex. Shimano SM-BBR60)" },
    28.99: { statut: "compatible", boitier: "boîtier BSA DUB (SRAM)" },
  },
  t47: {
    24: { statut: "compatible", boitier: "boîtier T47 pour axe 24 mm" },
    28.99: { statut: "compatible", boitier: "boîtier T47 DUB (SRAM)" },
  },
  bb86: {
    24: { statut: "compatible", boitier: "boîtier press fit 86,5 mm pour axe 24 mm (ex. Shimano SM-BB72-41B)" },
    28.99: { statut: "compatible", boitier: "boîtier press fit 86,5 mm DUB (SRAM)" },
  },
  pf30: {
    24: { statut: "adaptateur", boitier: "boîtier PF30 réducteur pour axe 24 mm" },
    28.99: { statut: "compatible", boitier: "boîtier PF30 DUB (SRAM)" },
  },
  bb386: {
    24: { statut: "adaptateur", boitier: "boîtier BB386 réducteur pour axe 24 mm" },
    28.99: { statut: "compatible", boitier: "boîtier BB386 DUB (SRAM)" },
  },
  bbright: {
    24: { statut: "adaptateur", boitier: "boîtier BBright réducteur pour axe 24 mm" },
  },
};
