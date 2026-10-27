// Recherche d'une pièce par la référence gravée dessus (plan B de l'étape 2).

import type { Emplacement, Piece } from "@/lib/types";

/** "rd r8000-ss" → "RDR8000SS" : on ignore majuscules, espaces, tirets et autres symboles. */
export function normaliser(saisie: string): string {
  return saisie.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** En dessous, une recherche par début de référence renverrait trop de pièces. */
const LONGUEUR_MIN_PREFIXE = 4;

export type ResultatRecherche =
  /** Rien de tapé */
  | { type: "vide" }
  /** Une ou plusieurs pièces de la bonne catégorie */
  | { type: "trouve"; pieces: Piece[] }
  /** La référence existe, mais pour une autre catégorie (ex. RD-R8000 tapé sur la ligne cassette) */
  | { type: "autre_categorie"; pieces: Piece[] }
  | { type: "inconnue"; saisie: string };

export function rechercherReference(saisie: string, categorie: Emplacement, catalogue: Piece[]): ResultatRecherche {
  const cle = normaliser(saisie);
  if (cle === "") return { type: "vide" };

  // D'abord l'égalité exacte, sinon les références qui commencent pareil (RD-R8000 → SS et GS)
  const exactes = catalogue.filter((p) => normaliser(p.reference) === cle);
  const candidates =
    exactes.length > 0
      ? exactes
      : cle.length >= LONGUEUR_MIN_PREFIXE
        ? catalogue.filter((p) => normaliser(p.reference).startsWith(cle))
        : [];

  const bonneCategorie = candidates.filter((p) => p.categorie === categorie);
  if (bonneCategorie.length > 0) return { type: "trouve", pieces: bonneCategorie };
  if (candidates.length > 0) return { type: "autre_categorie", pieces: candidates };
  return { type: "inconnue", saisie: saisie.trim() };
}
