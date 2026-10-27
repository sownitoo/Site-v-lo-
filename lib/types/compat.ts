import type { Configuration, Emplacement } from "./velo";

/**
 * - compatible : ça marche, homologué par le constructeur
 * - adaptateur : ça marche avec une pièce en plus (préciser laquelle)
 * - incompatible : ne marche pas, ou n'est pas homologué par le constructeur
 * - a_verifier : on ne peut pas trancher (info manquante, fiche non validée)
 */
export type Statut = "compatible" | "adaptateur" | "incompatible" | "a_verifier";

export interface ResultatRegle {
  /** Ex. "T4_capacite" */
  regle: string;
  statut: Statut;
  /** En clair, avec les chiffres */
  message: string;
  piecesConcernees: Emplacement[];
  /** Ex. "entretoise 1,85 mm" */
  adaptateur?: string;
}

/** Fonction pure. Renvoie null quand la règle ne s'applique pas (ex. pas de dérailleur avant). */
export type Regle = (config: Configuration) => ResultatRegle | null;
