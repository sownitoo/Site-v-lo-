// Chargement du catalogue JSON local (/data) et construction d'une configuration à partir d'un modèle de vélo.

import boitiers from "@/data/pieces/boitiers.json";
import cadres from "@/data/pieces/cadres.json";
import cassettes from "@/data/pieces/cassettes.json";
import chaines from "@/data/pieces/chaines.json";
import derailleursArriere from "@/data/pieces/derailleurs-arriere.json";
import derailleursAvant from "@/data/pieces/derailleurs-avant.json";
import electronique from "@/data/pieces/electronique.json";
import etriers from "@/data/pieces/etriers.json";
import manettes from "@/data/pieces/manettes.json";
import pedaliers from "@/data/pieces/pedaliers.json";
import roues from "@/data/pieces/roues.json";
import giantTcr2020 from "@/data/velos/giant-tcr-advanced-pro-1-disc-2020.json";
import type { Configuration, Emplacement, ModeleVelo, Piece } from "@/lib/types";

// Le JSON importé perd les types littéraux ("cassette" devient string) : on le recaste.
export const catalogue = [
  ...cadres,
  ...roues,
  ...boitiers,
  ...pedaliers,
  ...cassettes,
  ...chaines,
  ...derailleursArriere,
  ...derailleursAvant,
  ...manettes,
  ...electronique,
  ...etriers,
] as unknown as Piece[];

export const velos = [giantTcr2020] as unknown as ModeleVelo[];

const index = new Map(catalogue.map((p) => [p.id, p]));

export function piece(id: string): Piece {
  const p = index.get(id);
  if (!p) throw new Error(`Pièce inconnue dans le catalogue : ${id}`);
  return p;
}

/** Comme piece(), mais vérifie aussi la catégorie (utile dans les tests). */
export function pieceDe<E extends Emplacement>(categorie: E, id: string): Extract<Piece, { categorie: E }> {
  const p = piece(id);
  if (p.categorie !== categorie) {
    throw new Error(`${id} est un(e) ${p.categorie}, pas un(e) ${categorie}`);
  }
  return p as Extract<Piece, { categorie: E }>;
}

export function configurationDepuisVelo(velo: ModeleVelo): Configuration {
  const config: Record<string, Piece> = {};
  for (const [emplacement, id] of Object.entries(velo.composants)) {
    if (id) config[emplacement] = pieceDe(emplacement as Emplacement, id);
  }
  return config as Configuration;
}
