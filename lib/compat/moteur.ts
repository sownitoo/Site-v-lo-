// Moteur : lance toutes les règles sur une configuration et donne un statut global.

import type { Configuration, Piece, Regle, ResultatRegle, Statut } from "@/lib/types";
import { reglesTransmission } from "./regles/transmission";

export const toutesLesRegles: Regle[] = [...reglesTransmission];

const GRAVITE: Record<Statut, number> = {
  compatible: 0,
  adaptateur: 1,
  a_verifier: 2,
  incompatible: 3,
};

export interface Rapport {
  /** Le pire statut trouvé */
  statutGlobal: Statut;
  resultats: ResultatRegle[];
}

/**
 * On ne dit jamais "compatible" sur une fiche que personne n'a validée :
 * dans ce cas le résultat passe en "a_verifier".
 */
function degraderSiNonValide(r: ResultatRegle, config: Configuration): ResultatRegle {
  if (r.statut !== "compatible") return r;
  const nonValidees = r.piecesConcernees
    .map((e) => config[e] as Piece | undefined)
    .filter((p): p is Piece => p !== undefined && p.statutDonnees === "a_verifier");
  if (nonValidees.length === 0) return r;
  return {
    ...r,
    statut: "a_verifier",
    message: `${r.message} (fiche à valider : ${nonValidees.map((p) => p.reference).join(", ")})`,
  };
}

export function verifier(config: Configuration, regles: Regle[] = toutesLesRegles): Rapport {
  const resultats = regles
    .map((regle) => regle(config))
    .filter((r): r is ResultatRegle => r !== null)
    .map((r) => degraderSiNonValide(r, config));

  const statutGlobal = resultats.reduce<Statut>(
    (pire, r) => (GRAVITE[r.statut] > GRAVITE[pire] ? r.statut : pire),
    "compatible",
  );
  return { statutGlobal, resultats };
}
