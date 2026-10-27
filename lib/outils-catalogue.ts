// Fonctions pures sur le catalogue : utilisables côté client comme côté serveur.

import type { Configuration, Emplacement, ModeleVelo, Piece } from "@/lib/types";

export function indexer(catalogue: Piece[]): Map<string, Piece> {
  return new Map(catalogue.map((p) => [p.id, p]));
}

/** Pièce du catalogue, en vérifiant sa catégorie. */
export function pieceDe<E extends Emplacement>(
  index: Map<string, Piece>,
  categorie: E,
  id: string,
): Extract<Piece, { categorie: E }> {
  const p = index.get(id);
  if (!p) throw new Error(`Pièce inconnue dans le catalogue : ${id}`);
  if (p.categorie !== categorie) {
    throw new Error(`${id} est un(e) ${p.categorie}, pas un(e) ${categorie}`);
  }
  return p as Extract<Piece, { categorie: E }>;
}

/** Construit une configuration à partir d'une liste emplacement → id (null ou absent = pas de pièce). */
export function configurationDepuisIds(
  ids: Partial<Record<Emplacement, string | null>>,
  index: Map<string, Piece>,
): Configuration {
  const config: Record<string, Piece> = {};
  for (const [emplacement, id] of Object.entries(ids)) {
    if (id) config[emplacement] = pieceDe(index, emplacement as Emplacement, id);
  }
  return config as Configuration;
}

export function configurationDepuisVelo(velo: ModeleVelo, index: Map<string, Piece>): Configuration {
  return configurationDepuisIds(velo.composants, index);
}

// Menus en cascade marque → année → modèle, calculés depuis les vélos chargés.

export function marques(velos: ModeleVelo[]): string[] {
  return [...new Set(velos.map((v) => v.marque))].sort((a, b) => a.localeCompare(b));
}

export function annees(velos: ModeleVelo[], marque: string): number[] {
  return [...new Set(velos.filter((v) => v.marque === marque).map((v) => v.annee))].sort((a, b) => b - a);
}

export function modeles(velos: ModeleVelo[], marque: string, annee: number): ModeleVelo[] {
  return velos
    .filter((v) => v.marque === marque && v.annee === annee)
    .sort((a, b) => a.modele.localeCompare(b.modele));
}
