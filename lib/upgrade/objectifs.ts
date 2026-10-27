// Objectifs d'upgrade. Pour en ajouter un : ajouter une entrée dans OBJECTIFS.

import type { Configuration, Emplacement, Piece } from "@/lib/types";

export interface Objectif {
  id: string;
  libelle: string;
  description: string;
  /** Emplacements dont la pièce doit correspondre à l'objectif (remplacée si ce n'est pas déjà le cas) */
  aRemplacer: Emplacement[];
  /** Emplacements gardés tant qu'ils restent compatibles, remplacés sinon */
  aAdapter: Emplacement[];
  /** La pièce peut-elle être proposée pour cet objectif ? */
  candidat: (p: Piece) => boolean;
  /** Emplacement de aRemplacer qui peut rester vide (ex. pas de dérailleur avant en mono-plateau) */
  peutEtreAbsent?: (e: Emplacement, config: Configuration) => boolean;
}

function estDi2_12v(p: Piece): boolean {
  switch (p.categorie) {
    case "manettes":
    case "derailleur_arriere":
    case "derailleur_avant":
      return p.marque === "Shimano" && p.commande.type === "electronique" && p.commande.protocole === "di2_12v";
    case "electronique":
      return p.protocole === "di2_12v";
    case "pedalier":
    case "cassette":
    case "chaine":
      return p.marque === "Shimano" && p.vitesses === 12;
    default:
      // Boîtier, étriers… : toute pièce du catalogue peut remplacer une pièce devenue incompatible
      return true;
  }
}

export const OBJECTIFS: Objectif[] = [
  {
    id: "shimano_di2_12v",
    libelle: "Passer en Shimano Di2 12v",
    description: "Manettes, dérailleurs et batterie Di2 12 vitesses. Le reste est gardé s'il reste compatible.",
    aRemplacer: ["manettes", "derailleur_arriere", "derailleur_avant", "electronique"],
    aAdapter: ["pedalier", "cassette", "chaine", "boitier", "etriers"],
    candidat: estDi2_12v,
    peutEtreAbsent: (e, config) => e === "derailleur_avant" && config.pedalier?.plateaux.length === 1,
  },
];

export function objectifParId(id: string): Objectif | undefined {
  return OBJECTIFS.find((o) => o.id === id);
}
