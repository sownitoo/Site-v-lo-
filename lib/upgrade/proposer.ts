// Calcule la meilleure proposition d'upgrade : on essaie les combinaisons de pièces candidates,
// le moteur de compatibilité les juge, on garde celle qui demande le moins d'achats.

import { verifier, type Rapport } from "@/lib/compat/moteur";
import type { LigneAchat } from "@/lib/prix";
import type { Configuration, Emplacement, Piece, Statut } from "@/lib/types";
import type { Objectif } from "./objectifs";

/** Au-delà, on limite le nombre de candidats par emplacement (catalogue trop gros pour tout essayer). */
const MAX_COMBINAISONS = 20000;
const MAX_CANDIDATS_SI_TROP = 6;

export type Action = "garder" | "remplacer" | "ajouter";

export interface Changement {
  emplacement: Emplacement;
  actuelle?: Piece;
  proposee?: Piece;
  action: Action;
}

export interface AdaptateurRequis {
  regle: string;
  adaptateur: string;
  message: string;
}

export interface Proposition {
  config: Configuration;
  rapport: Rapport;
  /** Un changement par emplacement de l'objectif */
  changements: Changement[];
  /** Autres choix qui donnent aussi une configuration sans "incompatible" (null = aucune pièce) */
  alternatives: Partial<Record<Emplacement, (Piece | null)[]>>;
  adaptateurs: AdaptateurRequis[];
  achats: LigneAchat[];
  /** false = aucune combinaison du catalogue n'évite tous les "incompatible" */
  sansIncompatible: boolean;
}

/** Choix imposés par l'utilisateur à l'étape 3 : id de pièce, ou null pour « aucune ». */
export type ChoixImposes = Partial<Record<Emplacement, string | null>>;

type Option = Piece | undefined;

interface Essai {
  options: Option[];
  config: Configuration;
  rapport: Rapport;
  nbIncompatibles: number;
  nbAchats: number;
  nbAdaptateurs: number;
  prixConnuEur: number;
  ecart: number;
}

/** Distance entre la pièce actuelle et la nouvelle : on préfère garder les mêmes dentures. */
function ecart(a: Option, b: Option): number {
  if (!a || !b) return 0;
  if (a.categorie === "cassette" && b.categorie === "cassette") {
    return Math.abs(a.pignonMax - b.pignonMax) + Math.abs(a.pignonMin - b.pignonMin);
  }
  if (a.categorie === "pedalier" && b.categorie === "pedalier") {
    const n = Math.max(a.plateaux.length, b.plateaux.length);
    let d = 0;
    for (let i = 0; i < n; i++) d += Math.abs((a.plateaux[i] ?? 0) - (b.plateaux[i] ?? 0));
    return d;
  }
  return 0;
}

function sansDoublons(options: Option[]): Option[] {
  const vus = new Set<string>();
  return options.filter((o) => {
    const cle = o?.id ?? "__aucune__";
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

function optionsPour(e: Emplacement, config: Configuration, objectif: Objectif, catalogue: Piece[]): Option[] {
  const actuelle = config[e] as Option;
  const candidats = catalogue.filter((p) => p.categorie === e && objectif.candidat(p));

  if (objectif.aRemplacer.includes(e)) {
    // La pièce doit correspondre à l'objectif. On ne laisse l'emplacement vide que si l'objectif l'autorise.
    if (candidats.length === 0) return [actuelle];
    const vide = !actuelle && objectif.peutEtreAbsent?.(e, config);
    return sansDoublons(vide ? [undefined, ...candidats] : candidats);
  }
  // À adapter : on garde la pièce actuelle en premier choix
  return sansDoublons([actuelle, ...candidats]);
}

function produit<T>(listes: T[][]): T[][] {
  return listes.reduce<T[][]>((acc, liste) => acc.flatMap((combo) => liste.map((x) => [...combo, x])), [[]]);
}

function compter(rapport: Rapport, statut: Statut): number {
  return rapport.resultats.filter((r) => r.statut === statut).length;
}

function comparer(a: Essai, b: Essai): number {
  return (
    a.nbIncompatibles - b.nbIncompatibles ||
    a.nbAchats - b.nbAchats ||
    a.nbAdaptateurs - b.nbAdaptateurs ||
    a.prixConnuEur - b.prixConnuEur ||
    a.ecart - b.ecart
  );
}

export function proposer(
  config: Configuration,
  objectif: Objectif,
  catalogue: Piece[],
  imposes: ChoixImposes = {},
): Proposition {
  const emplacements = [...objectif.aRemplacer, ...objectif.aAdapter];
  let options = emplacements.map((e) => optionsPour(e, config, objectif, catalogue));
  if (options.reduce((n, o) => n * o.length, 1) > MAX_COMBINAISONS) {
    options = options.map((o) => o.slice(0, MAX_CANDIDATS_SI_TROP));
  }

  const essais: Essai[] = produit(options).map((combo) => {
    const cfg: Record<string, Piece> = { ...(config as Record<string, Piece>) };
    let nbAchats = 0;
    let prixConnuEur = 0;
    let ecartTotal = 0;
    combo.forEach((option, i) => {
      const e = emplacements[i];
      const actuelle = config[e] as Option;
      if (option) cfg[e] = option;
      else delete cfg[e];
      if (option && option.id !== actuelle?.id) {
        nbAchats++;
        prixConnuEur += option.prixEur ?? 0;
        ecartTotal += ecart(actuelle, option);
      }
    });
    const rapport = verifier(cfg as Configuration);
    return {
      options: combo,
      config: cfg as Configuration,
      rapport,
      nbIncompatibles: compter(rapport, "incompatible"),
      nbAchats,
      nbAdaptateurs: compter(rapport, "adaptateur"),
      prixConnuEur,
      ecart: ecartTotal,
    };
  });

  const valides = essais.filter((x) => x.nbIncompatibles === 0);

  // Autres choix possibles par emplacement, parmi les combinaisons sans "incompatible"
  const alternatives: Partial<Record<Emplacement, (Piece | null)[]>> = {};
  emplacements.forEach((e, i) => {
    const vus = new Map<string, Piece | null>();
    for (const essai of valides) {
      const o = essai.options[i];
      vus.set(o?.id ?? "__aucune__", o ?? null);
    }
    alternatives[e] = [...vus.values()];
  });

  // Choix imposés par l'utilisateur (ignorés s'ils ne font pas partie des options)
  const respecte = (essai: Essai) =>
    emplacements.every((e, i) => {
      if (!(e in imposes)) return true;
      const voulu = imposes[e];
      if (!options[i].some((o) => (o?.id ?? null) === voulu)) return true;
      return (essai.options[i]?.id ?? null) === voulu;
    });

  const filtres = essais.filter(respecte);
  const pool = filtres.length > 0 ? filtres : essais;
  const meilleur = [...pool].sort(comparer)[0];

  const changements: Changement[] = emplacements.map((e, i) => {
    const actuelle = config[e] as Option;
    const proposee = meilleur.options[i];
    const action: Action =
      proposee?.id === actuelle?.id ? "garder" : actuelle ? "remplacer" : "ajouter";
    return { emplacement: e, actuelle, proposee, action };
  });

  const adaptateurs: AdaptateurRequis[] = meilleur.rapport.resultats
    .filter((r) => r.statut === "adaptateur")
    .map((r) => ({ regle: r.regle, adaptateur: r.adaptateur ?? r.message, message: r.message }));

  const achats: LigneAchat[] = [
    ...changements
      .filter((c) => c.action !== "garder" && c.proposee)
      .map((c) => ({
        type: "piece" as const,
        libelle: c.proposee!.nom,
        reference: c.proposee!.reference,
        emplacement: c.emplacement,
        prixEur: c.proposee!.prixEur,
      })),
    ...adaptateurs.map((a) => ({ type: "adaptateur" as const, libelle: a.adaptateur })),
  ];

  return {
    config: meilleur.config,
    rapport: meilleur.rapport,
    changements,
    alternatives,
    adaptateurs,
    achats,
    sansIncompatible: meilleur.nbIncompatibles === 0,
  };
}
