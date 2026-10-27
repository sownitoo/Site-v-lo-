import type { StatutDonnees } from "./communs";
import type { Categorie, Piece } from "./pieces";

/** Un emplacement sur le vélo = une catégorie de pièce. */
export type Emplacement = Categorie;

/** Fiche d'un modèle de vélo du catalogue (marque → année → modèle). */
export interface ModeleVelo {
  /** Ex. "giant-tcr-advanced-pro-1-disc-2020" */
  id: string;
  marque: string;
  annee: number;
  modele: string;
  photos: string[];
  /** id des pièces du catalogue montées d'origine */
  composants: Partial<Record<Emplacement, string>>;
  sources: string[];
  statutDonnees: StatutDonnees;
}

/** Le vélo de l'utilisateur : une pièce (au plus) par emplacement. */
export type Configuration = {
  [E in Emplacement]?: Extract<Piece, { categorie: E }>;
};
