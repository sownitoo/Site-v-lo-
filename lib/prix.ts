// Récapitulatif des achats de l'étape 3 et calcul du prix total.

import type { Emplacement } from "@/lib/types";

export interface LigneAchat {
  type: "piece" | "adaptateur";
  libelle: string;
  reference?: string;
  emplacement?: Emplacement;
  /** Prix indicatif en euros, absent si non renseigné dans le catalogue */
  prixEur?: number;
}

export interface Total {
  /** Somme des prix connus, en euros, arrondie au centime */
  totalEur: number;
  /** Nombre de lignes sans prix : le total est alors partiel */
  nbSansPrix: number;
  complet: boolean;
}

function prixValide(prix: number | undefined): prix is number {
  return typeof prix === "number" && Number.isFinite(prix) && prix >= 0;
}

export function totalAchats(lignes: LigneAchat[]): Total {
  const avecPrix = lignes.filter((l) => prixValide(l.prixEur));
  const somme = avecPrix.reduce((s, l) => s + (l.prixEur as number), 0);
  const nbSansPrix = lignes.length - avecPrix.length;
  return {
    totalEur: Math.round(somme * 100) / 100,
    nbSansPrix,
    complet: nbSansPrix === 0,
  };
}

const FORMAT_EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formaterEur(montant: number): string {
  // Intl met des espaces insécables : on les garde, c'est la typographie française
  return FORMAT_EUR.format(montant);
}
