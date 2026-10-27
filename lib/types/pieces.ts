import type {
  Axe,
  Commande,
  CorpsRoueLibre,
  EmplacementBatterie,
  FixationDerailleurAvant,
  FixationDisque,
  Fluide,
  MontageEtrier,
  Pouce,
  StandardBoitier,
  StandardChaine,
  StatutDonnees,
  Vitesses,
} from "./communs";

// Chaque pièce décrit ses interfaces : ce qu'elle exige et ce qu'elle propose.
// Une union discriminée sur `categorie` permet à TypeScript de vérifier chaque champ.

interface PieceBase {
  /** Identifiant unique, ex. "shimano-rd-r8150" */
  id: string;
  marque: string;
  /** Référence gravée sur la pièce, ex. "RD-R8150" (sert au plan B) */
  reference: string;
  nom: string;
  gamme?: string;
  /** Prix indicatif en euros */
  prixEur?: number;
  /** Liens vers la fiche ou le tableau de compatibilité officiel */
  sources: string[];
  statutDonnees: StatutDonnees;
}

export interface Cassette extends PieceBase {
  categorie: "cassette";
  vitesses: Vitesses;
  /** Corps de roue libre sur lesquels le fabricant homologue la cassette */
  corpsCompatibles: CorpsRoueLibre[];
  chaineExigee: StandardChaine;
  pignonMin: number;
  pignonMax: number;
}

export interface DerailleurArriere extends PieceBase {
  categorie: "derailleur_arriere";
  vitesses: Vitesses;
  commande: Commande;
  pignonMaxAccepte: number;
  /** Écart de dents total absorbé par la chape */
  capaciteTotale: number;
  /** Un dérailleur "patte" se monte aussi sur un cadre UDH (la patte UDH est fournie) */
  fixation: "patte" | "udh_direct";
}

export interface DerailleurAvant extends PieceBase {
  categorie: "derailleur_avant";
  vitesses: Vitesses;
  commande: Commande;
  fixation: FixationDerailleurAvant;
  grandPlateauMin: number;
  grandPlateauMax: number;
  ecartPlateauxMax: number;
  ligneChaineMm?: number;
}

export interface Pedalier extends PieceBase {
  categorie: "pedalier";
  vitesses: Vitesses;
  /** Du plus grand au plus petit, ex. [52, 36] */
  plateaux: number[];
  diametreAxeMm: number;
  ligneChaineMm?: number;
  /** Info utilisateur, pas une règle */
  longueurManivelleMm?: number;
}

export interface BoitierPedalier extends PieceBase {
  categorie: "boitier";
  /** Ce qu'il faut côté cadre */
  standardExige: StandardBoitier;
  /** Ce qu'il propose au pédalier */
  diametreAxeAccepteMm: number;
}

export interface Chaine extends PieceBase {
  categorie: "chaine";
  vitesses: Vitesses;
  standard: StandardChaine;
}

export interface Manettes extends PieceBase {
  categorie: "manettes";
  vitesses: Vitesses;
  commande: Commande;
  frein: "disque_hydro" | "disque_meca" | "patins";
  /** Seulement pour les freins hydrauliques */
  fluide?: Fluide;
}

/** Batterie + câbles d'un système électronique */
export interface KitElectronique extends PieceBase {
  categorie: "electronique";
  protocole: "di2_11v" | "di2_12v";
  emplacementsBatterie: EmplacementBatterie[];
}

/** Cadre + fourche, vendus ensemble */
export interface Cadre extends PieceBase {
  categorie: "cadre";
  // Transmission
  boitier: StandardBoitier;
  fixationDerailleurAvant: FixationDerailleurAvant | { type: "aucune" };
  patteDerailleur: "classique" | "udh";
  /** Plusieurs possibles quand le cadre a des caches interchangeables */
  passagesCables: ("externe" | "interne_meca" | "interne_di2")[];
  tigeSelleExigee: { forme: "ronde"; diametreMm: number } | { forme: "proprietaire"; reference: string };
  logementsBatterieDi2: EmplacementBatterie[];
  // Roues, freins, direction
  axeAvant: Axe;
  axeArriere: Axe;
  freins: "disque" | "patins";
  montageEtriers?: MontageEtrier;
  disqueMaxMm?: { avant: number; arriere: number };
  passagePneuMaxMm: number;
  pivot: { haut: Pouce; bas: Pouce };
  routageIntegre: "non" | "standard" | "proprietaire";
}

/** Paire de roues */
export interface Roues extends PieceBase {
  categorie: "roues";
  axeAvant: Axe;
  axeArriere: Axe;
  /** Corps monté */
  corpsRoueLibre: CorpsRoueLibre;
  /** Corps proposés en option par le fabricant de la roue */
  corpsDisponibles: CorpsRoueLibre[];
  frein: "disque" | "patins";
  fixationDisque?: FixationDisque;
  largeurInterneMm: number;
  montages: ("tubeless" | "chambre" | "boyau")[];
  diametre: "700c" | "650b";
}

export interface Etriers extends PieceBase {
  categorie: "etriers";
  montage: MontageEtrier;
  fluide: Fluide;
}

/** Paire de disques */
export interface Disques extends PieceBase {
  categorie: "disques";
  diametreAvantMm: number;
  diametreArriereMm: number;
  fixation: FixationDisque;
}

export interface Pneus extends PieceBase {
  categorie: "pneus";
  diametre: "700c" | "650b";
  largeurMm: number;
  tubeless: boolean;
}

export interface Cintre extends PieceBase {
  categorie: "cintre";
  diametreSerrageMm: number;
  routageInterne: boolean;
}

export interface Potence extends PieceBase {
  categorie: "potence";
  diametrePivot: Pouce;
  serrageCintreMm: number;
}

export interface TigeSelle extends PieceBase {
  categorie: "tige_selle";
  forme: { forme: "ronde"; diametreMm: number } | { forme: "proprietaire"; reference: string };
  compatibleBatterieDi2: boolean;
}

export type Piece =
  | Cadre
  | Roues
  | Pedalier
  | BoitierPedalier
  | Cassette
  | Chaine
  | DerailleurArriere
  | DerailleurAvant
  | Manettes
  | KitElectronique
  | Etriers
  | Disques
  | Pneus
  | Cintre
  | Potence
  | TigeSelle;

export type Categorie = Piece["categorie"];
