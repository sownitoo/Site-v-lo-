// Types de base partagés par toutes les pièces.
// Convention : l'unité est dans le nom du champ (Mm, Eur…) pour éviter toute confusion mm / pouces.

export type Vitesses = 11 | 12;

/** "a_verifier" tant que Baptiste n'a pas validé la fiche à la main. */
export type StatutDonnees = "a_verifier" | "valide";

export type ProtocoleElec = "di2_11v" | "di2_12v" | "sram_axs";

export type Commande =
  | { type: "mecanique" }
  | { type: "electronique"; protocole: ProtocoleElec };

/**
 * Corps de roue libre.
 * - hg_11v_route : corps Shimano route 11v (HG L). Accepte aussi les cassettes route Shimano 12v.
 * - hg_l2_12v_route : corps Shimano route 12v (HG L2). Cassettes route 12v uniquement.
 */
export type CorpsRoueLibre =
  | "hg_11v_route"
  | "hg_l2_12v_route"
  | "hg_vtt"
  | "microspline"
  | "xd"
  | "xdr"
  | "n3w";

export type StandardBoitier = "bsa" | "t47" | "bb86" | "pf30" | "bb386" | "bbright";

export type StandardChaine = "shimano_hg" | "sram_flattop";

export type Fluide = "mineral" | "dot";

export type FixationDisque = "centerlock" | "6trous";

export type MontageEtrier = "flat_mount" | "post_mount";

export type Pouce = "1-1/8" | "1-1/4" | "1-1/2";

/** Ex. 12×142 traversant : { type: "traversant", diametreMm: 12, largeurMm: 142 } */
export interface Axe {
  type: "traversant" | "blocage_rapide";
  diametreMm: number;
  largeurMm: number;
}

export type FixationDerailleurAvant =
  | { type: "brasee" }
  | { type: "collier"; diametreMm: number };

export type EmplacementBatterie = "tige_selle" | "cadre";
