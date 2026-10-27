// Règles de compatibilité de la transmission (+ fluide de frein, qui change avec les manettes).
// Chaque règle est une fonction pure : configuration → résultat, ou null si elle ne s'applique pas.
// Principe : ce que le constructeur n'homologue pas est "incompatible", même si ça marche en pratique.

import type {
  Commande,
  CorpsRoueLibre,
  Emplacement,
  Regle,
  ResultatRegle,
  StandardBoitier,
  Statut,
} from "@/lib/types";
import { BOITIERS } from "../tables";

const NOM: Record<Emplacement, string> = {
  cadre: "cadre",
  roues: "roues",
  pedalier: "pédalier",
  boitier: "boîtier",
  cassette: "cassette",
  chaine: "chaîne",
  derailleur_arriere: "dérailleur arrière",
  derailleur_avant: "dérailleur avant",
  manettes: "manettes",
  electronique: "kit électronique",
  etriers: "étriers",
  disques: "disques",
  pneus: "pneus",
  cintre: "cintre",
  potence: "potence",
  tige_selle: "tige de selle",
};

const NOM_CORPS: Record<CorpsRoueLibre, string> = {
  hg_11v_route: "Shimano HG route 11v",
  hg_l2_12v_route: "Shimano HG L2 route 12v",
  hg_vtt: "Shimano HG VTT",
  microspline: "Shimano Micro Spline",
  xd: "SRAM XD",
  xdr: "SRAM XDR",
  n3w: "Campagnolo N3W",
};

const NOM_BOITIER: Record<StandardBoitier, string> = {
  bsa: "BSA (fileté)",
  t47: "T47 (fileté)",
  bb86: "BB86 (press fit)",
  pf30: "PF30 (press fit)",
  bb386: "BB386 (press fit)",
  bbright: "BBright (press fit)",
};

function protocole(commande: Commande): string {
  return commande.type === "mecanique" ? "mecanique" : commande.protocole;
}

const NOM_PROTOCOLE: Record<string, string> = {
  mecanique: "mécanique",
  di2_11v: "Di2 11v",
  di2_12v: "Di2 12v",
  sram_axs: "SRAM AXS",
};

function res(
  regle: string,
  statut: Statut,
  message: string,
  piecesConcernees: Emplacement[],
  adaptateur?: string,
): ResultatRegle {
  return adaptateur ? { regle, statut, message, piecesConcernees, adaptateur } : { regle, statut, message, piecesConcernees };
}

/** T1 : même nombre de vitesses partout. Les manettes servent de référence (elles définissent le système). */
export const t1Vitesses: Regle = (c) => {
  const ordre = ["manettes", "derailleur_arriere", "derailleur_avant", "cassette", "chaine", "pedalier"] as const;
  const presentes = ordre.flatMap((e) => {
    const p = c[e];
    return p ? [{ e, vitesses: p.vitesses, reference: p.reference }] : [];
  });
  if (presentes.length < 2) return null;

  const ref = presentes[0];
  const differentes = presentes.filter((x) => x.vitesses !== ref.vitesses);
  const toutes = presentes.map((x) => x.e);
  if (differentes.length === 0) {
    return res("T1_vitesses", "compatible", `Toute la transmission est en ${ref.vitesses} vitesses.`, toutes);
  }
  const liste = differentes.map((x) => `${NOM[x.e]} ${x.reference} en ${x.vitesses}v`).join(", ");
  return res(
    "T1_vitesses",
    "incompatible",
    `${NOM[ref.e]} ${ref.reference} en ${ref.vitesses}v, mais ${liste}. Mélange non homologué par le constructeur.`,
    [ref.e, ...differentes.map((x) => x.e)],
  );
};

/** T2 : la cassette doit être homologuée sur le corps de roue libre de la roue arrière. */
export const t2CorpsRoueLibre: Regle = (c) => {
  const { cassette, roues } = c;
  if (!cassette || !roues) return null;
  const concernees: Emplacement[] = ["cassette", "roues"];

  if (cassette.corpsCompatibles.includes(roues.corpsRoueLibre)) {
    return res(
      "T2_corps_roue_libre",
      "compatible",
      `Cassette ${cassette.reference} homologuée sur le corps ${NOM_CORPS[roues.corpsRoueLibre]} des roues ${roues.reference}.`,
      concernees,
    );
  }
  const exiges = cassette.corpsCompatibles.map((x) => NOM_CORPS[x]).join(" ou ");
  const option = roues.corpsDisponibles.find((x) => cassette.corpsCompatibles.includes(x));
  if (option) {
    return res(
      "T2_corps_roue_libre",
      "adaptateur",
      `Les roues ${roues.reference} ont un corps ${NOM_CORPS[roues.corpsRoueLibre]}, la cassette ${cassette.reference} exige ${exiges}. Le fabricant des roues propose un corps ${NOM_CORPS[option]}.`,
      concernees,
      `corps de roue libre ${NOM_CORPS[option]}`,
    );
  }
  return res(
    "T2_corps_roue_libre",
    "incompatible",
    `La cassette ${cassette.reference} exige ${exiges}, et les roues ${roues.reference} n'existent qu'en ${roues.corpsDisponibles.map((x) => NOM_CORPS[x]).join(", ")}.`,
    concernees,
  );
};

/** T3 : plus grand pignon ≤ plus grand pignon accepté par le dérailleur arrière. */
export const t3PignonMax: Regle = (c) => {
  const { cassette, derailleur_arriere: rd } = c;
  if (!cassette || !rd) return null;
  const ok = cassette.pignonMax <= rd.pignonMaxAccepte;
  return res(
    "T3_pignon_max",
    ok ? "compatible" : "incompatible",
    `Plus grand pignon ${cassette.pignonMax} dents ${ok ? "≤" : ">"} ${rd.pignonMaxAccepte} dents acceptées par le ${rd.reference}.`,
    ["cassette", "derailleur_arriere"],
  );
};

/** T4 : (grand plateau − petit plateau) + (grand pignon − petit pignon) ≤ capacité du dérailleur arrière. */
export const t4Capacite: Regle = (c) => {
  const { cassette, derailleur_arriere: rd, pedalier } = c;
  if (!cassette || !rd || !pedalier) return null;

  const grand = Math.max(...pedalier.plateaux);
  const petit = Math.min(...pedalier.plateaux);
  const avant = grand - petit;
  const arriere = cassette.pignonMax - cassette.pignonMin;
  const total = avant + arriere;
  const ok = total <= rd.capaciteTotale;

  const calcul =
    pedalier.plateaux.length > 1
      ? `(${grand} − ${petit}) + (${cassette.pignonMax} − ${cassette.pignonMin}) = ${avant} + ${arriere} = ${total} dents`
      : `mono-plateau : (${cassette.pignonMax} − ${cassette.pignonMin}) = ${total} dents`;
  return res(
    "T4_capacite",
    ok ? "compatible" : "incompatible",
    `Capacité nécessaire ${calcul} ${ok ? "≤" : ">"} ${rd.capaciteTotale} dents de capacité du ${rd.reference}.`,
    ["pedalier", "cassette", "derailleur_arriere"],
  );
};

/** T5 : grand plateau dans la plage du dérailleur avant, écart entre plateaux ≤ écart max. */
export const t5PlateauxDerailleurAvant: Regle = (c) => {
  const { derailleur_avant: fd, pedalier } = c;
  if (!fd || !pedalier) return null;
  const concernees: Emplacement[] = ["derailleur_avant", "pedalier"];

  if (pedalier.plateaux.length < 2) {
    return res("T5_plateaux", "incompatible", `Le pédalier ${pedalier.reference} est mono-plateau : pas de dérailleur avant.`, concernees);
  }
  const grand = Math.max(...pedalier.plateaux);
  const petit = Math.min(...pedalier.plateaux);
  const ecart = grand - petit;

  if (grand < fd.grandPlateauMin || grand > fd.grandPlateauMax) {
    return res(
      "T5_plateaux",
      "incompatible",
      `Grand plateau ${grand} dents hors de la plage ${fd.grandPlateauMin}–${fd.grandPlateauMax} dents du ${fd.reference}.`,
      concernees,
    );
  }
  if (ecart > fd.ecartPlateauxMax) {
    return res(
      "T5_plateaux",
      "incompatible",
      `Écart entre plateaux ${grand} − ${petit} = ${ecart} dents > ${fd.ecartPlateauxMax} dents max du ${fd.reference}.`,
      concernees,
    );
  }
  return res(
    "T5_plateaux",
    "compatible",
    `Plateaux ${grand}-${petit} : grand plateau dans ${fd.grandPlateauMin}–${fd.grandPlateauMax} dents, écart ${ecart} ≤ ${fd.ecartPlateauxMax} dents (${fd.reference}).`,
    concernees,
  );
};

/** T6 : fixation du dérailleur avant ↔ cadre (brasé ou collier). */
export const t6FixationDerailleurAvant: Regle = (c) => {
  const { derailleur_avant: fd, cadre } = c;
  if (!fd || !cadre) return null;
  const concernees: Emplacement[] = ["derailleur_avant", "cadre"];
  const fCadre = cadre.fixationDerailleurAvant;
  const fFd = fd.fixation;

  if (fCadre.type === "aucune") {
    return res("T6_fixation_fd", "incompatible", `Le cadre ${cadre.reference} n'a pas de fixation de dérailleur avant (cadre mono-plateau).`, concernees);
  }
  if (fFd.type === "brasee" && fCadre.type === "brasee") {
    return res("T6_fixation_fd", "compatible", `Dérailleur avant brasé ${fd.reference} sur patte brasée du cadre.`, concernees);
  }
  if (fFd.type === "brasee" && fCadre.type === "collier") {
    return res(
      "T6_fixation_fd",
      "adaptateur",
      `Dérailleur avant brasé ${fd.reference} sur un cadre à collier Ø${fCadre.diametreMm} mm : il faut un collier adaptateur.`,
      concernees,
      `collier adaptateur Ø${fCadre.diametreMm} mm pour dérailleur brasé`,
    );
  }
  if (fFd.type === "collier" && fCadre.type === "brasee") {
    return res("T6_fixation_fd", "incompatible", `Dérailleur avant à collier ${fd.reference} sur un cadre à patte brasée : prendre la version brasée.`, concernees);
  }
  if (fFd.type === "collier" && fCadre.type === "collier") {
    const ok = fFd.diametreMm === fCadre.diametreMm;
    return res(
      "T6_fixation_fd",
      ok ? "compatible" : "incompatible",
      `Collier du dérailleur Ø${fFd.diametreMm} mm ${ok ? "=" : "≠"} tube de selle Ø${fCadre.diametreMm} mm.`,
      concernees,
    );
  }
  return null;
};

/** T7 : même protocole de commande sur manettes, dérailleurs et kit électronique. */
export const t7Protocole: Regle = (c) => {
  const ordre = ["manettes", "derailleur_arriere", "derailleur_avant"] as const;
  const commandes = ordre.flatMap((e) => {
    const p = c[e];
    return p ? [{ e, protocole: protocole(p.commande), reference: p.reference }] : [];
  });
  if (commandes.length === 0 || (commandes.length === 1 && !c.electronique)) return null;

  const ref = commandes[0];
  const differentes = commandes.filter((x) => x.protocole !== ref.protocole);
  if (differentes.length > 0) {
    const liste = differentes.map((x) => `${NOM[x.e]} ${x.reference} en ${NOM_PROTOCOLE[x.protocole]}`).join(", ");
    return res(
      "T7_protocole",
      "incompatible",
      `${NOM[ref.e]} ${ref.reference} en ${NOM_PROTOCOLE[ref.protocole]}, mais ${liste}.`,
      [ref.e, ...differentes.map((x) => x.e)],
    );
  }

  const toutes = commandes.map((x) => x.e);
  const estFilaire = ref.protocole === "di2_11v" || ref.protocole === "di2_12v";
  if (estFilaire) {
    if (!c.electronique) {
      return res("T7_protocole", "incompatible", `Il manque la batterie et les câbles ${NOM_PROTOCOLE[ref.protocole]}.`, [...toutes, "electronique"]);
    }
    if (c.electronique.protocole !== ref.protocole) {
      return res(
        "T7_protocole",
        "incompatible",
        `Kit ${c.electronique.reference} en ${NOM_PROTOCOLE[c.electronique.protocole]}, transmission en ${NOM_PROTOCOLE[ref.protocole]} : les générations Di2 11v et 12v ne communiquent pas.`,
        [...toutes, "electronique"],
      );
    }
    return res("T7_protocole", "compatible", `Commande homogène en ${NOM_PROTOCOLE[ref.protocole]}, batterie comprise.`, [...toutes, "electronique"]);
  }
  return res("T7_protocole", "compatible", `Commande homogène : ${NOM_PROTOCOLE[ref.protocole]}.`, toutes);
};

/** T8 : le cadre doit avoir le bon passage de câbles pour le type de commande. */
export const t8PassageCables: Regle = (c) => {
  const { cadre } = c;
  const commande = (c.manettes ?? c.derailleur_arriere ?? c.derailleur_avant)?.commande;
  if (!cadre || !commande) return null;
  const concernees: Emplacement[] = ["cadre", c.manettes ? "manettes" : c.derailleur_arriere ? "derailleur_arriere" : "derailleur_avant"];
  const passages = cadre.passagesCables;

  if (commande.type === "mecanique") {
    const ok = passages.includes("interne_meca") || passages.includes("externe");
    return res(
      "T8_passage_cables",
      ok ? "compatible" : "incompatible",
      ok ? `Le cadre ${cadre.reference} accepte les gaines mécaniques.` : `Le cadre ${cadre.reference} est prévu pour l'électronique uniquement (pas de passage de gaines).`,
      concernees,
    );
  }
  if (commande.protocole === "sram_axs") {
    return res("T8_passage_cables", "compatible", "Transmission sans fil : aucun passage de câble nécessaire.", concernees);
  }
  if (passages.includes("interne_di2")) {
    return res("T8_passage_cables", "compatible", `Le cadre ${cadre.reference} a un passage interne compatible Di2.`, concernees);
  }
  if (passages.includes("externe")) {
    return res(
      "T8_passage_cables",
      "a_verifier",
      `Le cadre ${cadre.reference} n'a qu'un passage externe : vérifier que Shimano prévoit une installation externe pour ce groupe ${NOM_PROTOCOLE[commande.protocole]}.`,
      concernees,
    );
  }
  return res("T8_passage_cables", "incompatible", `Le cadre ${cadre.reference} est prévu pour des gaines mécaniques uniquement : pas de passage Di2.`, concernees);
};

/** T9 : il faut un logement pour la batterie (cadre ou tige de selle). */
export const t9Batterie: Regle = (c) => {
  const { electronique: kit, cadre } = c;
  if (!kit || !cadre) return null;
  const concernees: Emplacement[] = ["electronique", "cadre"];

  const possibles = kit.emplacementsBatterie.filter((x) => cadre.logementsBatterieDi2.includes(x));
  if (possibles.length === 0) {
    return res("T9_batterie", "incompatible", `Ni le cadre ${cadre.reference} ni sa tige de selle ne peuvent recevoir la batterie ${kit.reference}.`, concernees);
  }
  if (possibles.includes("cadre")) {
    return res("T9_batterie", "compatible", `Batterie ${kit.reference} logée dans le cadre.`, concernees);
  }

  // Batterie dans la tige de selle
  const tige = c.tige_selle;
  if (tige) {
    return res(
      "T9_batterie",
      tige.compatibleBatterieDi2 ? "compatible" : "incompatible",
      tige.compatibleBatterieDi2
        ? `Batterie ${kit.reference} logée dans la tige de selle ${tige.reference}.`
        : `La tige de selle ${tige.reference} ne peut pas recevoir la batterie ${kit.reference}.`,
      [...concernees, "tige_selle"],
    );
  }
  const exigee = cadre.tigeSelleExigee;
  const detail =
    exigee.forme === "proprietaire"
      ? `tige propriétaire ${exigee.reference} : vérifier que le fabricant propose un support de batterie Di2`
      : `tige ronde Ø${exigee.diametreMm} mm : vérifier que ta tige accepte la batterie`;
  return res("T9_batterie", "a_verifier", `Batterie ${kit.reference} dans la tige de selle, ${detail}.`, concernees);
};

/** T10 : axe du pédalier ↔ boîtier ↔ standard du cadre. */
export const t10Boitier: Regle = (c) => {
  const { pedalier, cadre, boitier } = c;
  if (!pedalier || !cadre) return null;
  const axe = pedalier.diametreAxeMm;

  if (boitier) {
    const concernees: Emplacement[] = ["pedalier", "boitier", "cadre"];
    if (boitier.standardExige !== cadre.boitier) {
      return res(
        "T10_boitier",
        "incompatible",
        `Boîtier ${boitier.reference} prévu pour ${NOM_BOITIER[boitier.standardExige]}, cadre en ${NOM_BOITIER[cadre.boitier]}.`,
        concernees,
      );
    }
    if (boitier.diametreAxeAccepteMm !== axe) {
      return res(
        "T10_boitier",
        "incompatible",
        `Boîtier ${boitier.reference} pour axe ${boitier.diametreAxeAccepteMm} mm, pédalier ${pedalier.reference} avec axe ${axe} mm.`,
        concernees,
      );
    }
    return res("T10_boitier", "compatible", `Pédalier axe ${axe} mm dans boîtier ${boitier.reference}, cadre ${NOM_BOITIER[cadre.boitier]}.`, concernees);
  }

  const concernees: Emplacement[] = ["pedalier", "cadre"];
  const solution = BOITIERS[cadre.boitier]?.[axe];
  if (!solution) {
    return res("T10_boitier", "a_verifier", `Pas de solution connue pour un axe ${axe} mm dans un cadre ${NOM_BOITIER[cadre.boitier]}.`, concernees);
  }
  if (solution.statut === "adaptateur") {
    return res("T10_boitier", "adaptateur", `Axe ${axe} mm dans un cadre ${NOM_BOITIER[cadre.boitier]} : il faut un ${solution.boitier}.`, concernees, solution.boitier);
  }
  return res("T10_boitier", "compatible", `Axe ${axe} mm dans un cadre ${NOM_BOITIER[cadre.boitier]} : prévoir un ${solution.boitier}.`, concernees);
};

/** T11 : standard de chaîne exigé par la cassette (Shimano HG ≠ SRAM Flattop). */
export const t11StandardChaine: Regle = (c) => {
  const { chaine, cassette } = c;
  if (!chaine || !cassette) return null;
  const ok = chaine.standard === cassette.chaineExigee;
  return res(
    "T11_standard_chaine",
    ok ? "compatible" : "incompatible",
    ok
      ? `Chaîne ${chaine.reference} au standard attendu par la cassette ${cassette.reference}.`
      : `Chaîne ${chaine.reference} (${chaine.standard}) non homologuée avec la cassette ${cassette.reference} (${cassette.chaineExigee}).`,
    ["chaine", "cassette"],
  );
};

/** T12 : fixation du dérailleur arrière ↔ patte du cadre. */
export const t12FixationDerailleurArriere: Regle = (c) => {
  const { derailleur_arriere: rd, cadre } = c;
  if (!rd || !cadre) return null;
  const ok = rd.fixation === "patte" || cadre.patteDerailleur === "udh";
  return res(
    "T12_fixation_rd",
    ok ? "compatible" : "incompatible",
    ok
      ? `Dérailleur ${rd.reference} sur patte ${cadre.patteDerailleur === "udh" ? "UDH" : "classique"}.`
      : `Le ${rd.reference} se monte directement sur un cadre UDH, le cadre ${cadre.reference} a une patte classique.`,
    ["derailleur_arriere", "cadre"],
  );
};

/** T13 : type de frein et fluide des manettes ↔ étriers et cadre. Jamais mélanger huile minérale et DOT. */
export const t13Freins: Regle = (c) => {
  const { manettes, etriers, cadre } = c;
  if (!manettes || (!etriers && !cadre)) return null;

  if (cadre) {
    const manettesDisque = manettes.frein !== "patins";
    if (manettesDisque !== (cadre.freins === "disque")) {
      return res(
        "T13_freins",
        "incompatible",
        `Manettes ${manettes.reference} pour freins ${manettesDisque ? "à disque" : "à patins"}, cadre ${cadre.reference} pour freins ${cadre.freins === "disque" ? "à disque" : "à patins"}.`,
        ["manettes", "cadre"],
      );
    }
  }
  if (etriers && manettes.frein === "disque_hydro") {
    const ok = manettes.fluide === etriers.fluide;
    return res(
      "T13_freins",
      ok ? "compatible" : "incompatible",
      ok
        ? `Manettes ${manettes.reference} et étriers ${etriers.reference} au même fluide (${etriers.fluide === "mineral" ? "huile minérale" : "DOT"}).`
        : `Manettes ${manettes.reference} en ${manettes.fluide === "mineral" ? "huile minérale" : "DOT"}, étriers ${etriers.reference} en ${etriers.fluide === "mineral" ? "huile minérale" : "DOT"} : fluides incompatibles.`,
      ["manettes", "etriers"],
    );
  }
  return res("T13_freins", "compatible", `Manettes ${manettes.reference} adaptées au type de frein du vélo.`, cadre ? ["manettes", "cadre"] : ["manettes"]);
};

export const reglesTransmission: Regle[] = [
  t1Vitesses,
  t2CorpsRoueLibre,
  t3PignonMax,
  t4Capacite,
  t5PlateauxDerailleurAvant,
  t6FixationDerailleurAvant,
  t7Protocole,
  t8PassageCables,
  t9Batterie,
  t10Boitier,
  t11StandardChaine,
  t12FixationDerailleurArriere,
  t13Freins,
];
