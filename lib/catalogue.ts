// Catalogue chargé depuis /data (côté serveur et tests uniquement : lecture de fichiers).
// Côté client, le catalogue arrive en props depuis app/page.tsx.

import { chargerDonnees } from "@/lib/donnees";
import * as outils from "@/lib/outils-catalogue";
import type { Configuration, Emplacement, ModeleVelo, Piece } from "@/lib/types";

const donnees = chargerDonnees();

export const catalogue: Piece[] = donnees.catalogue;
export const velos: ModeleVelo[] = donnees.velos;

const index = outils.indexer(catalogue);

export function piece(id: string): Piece {
  const p = index.get(id);
  if (!p) throw new Error(`Pièce inconnue dans le catalogue : ${id}`);
  return p;
}

/** Comme piece(), mais vérifie aussi la catégorie (utile dans les tests). */
export function pieceDe<E extends Emplacement>(categorie: E, id: string): Extract<Piece, { categorie: E }> {
  return outils.pieceDe(index, categorie, id);
}

export function configurationDepuisVelo(velo: ModeleVelo): Configuration {
  return outils.configurationDepuisVelo(velo, index);
}
