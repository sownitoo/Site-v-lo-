import { describe, expect, it } from "vitest";
import { pieceDe } from "@/lib/catalogue";
import {
  t10Boitier,
  t11StandardChaine,
  t12FixationDerailleurArriere,
  t13Freins,
  t1Vitesses,
  t2CorpsRoueLibre,
  t3PignonMax,
  t4Capacite,
  t5PlateauxDerailleurAvant,
  t6FixationDerailleurAvant,
  t7Protocole,
  t8PassageCables,
  t9Batterie,
} from "@/lib/compat/regles/transmission";
import { cadreTest, tcrDi2, tcrOrigine } from "./fixtures";

const rd8000ss = pieceDe("derailleur_arriere", "shimano-rd-r8000-ss");
const cs8000_1130 = pieceDe("cassette", "shimano-cs-r8000-11-30");
const cs8100_1134 = pieceDe("cassette", "shimano-cs-r8100-11-34");
const fc8000 = pieceDe("pedalier", "shimano-fc-r8000-52-36");
const fc8100_5034 = pieceDe("pedalier", "shimano-fc-r8100-50-34");
const fd8000 = pieceDe("derailleur_avant", "shimano-fd-r8000-f");
const fd8150 = pieceDe("derailleur_avant", "shimano-fd-r8150");
const rd8150 = pieceDe("derailleur_arriere", "shimano-rd-r8150");
const zipp = pieceDe("roues", "zipp-303-s-xdr");
const kitDi2 = pieceDe("electronique", "shimano-di2-12v-bt-dn300");
const tcr = tcrOrigine.cadre!;

describe("T1 — même nombre de vitesses", () => {
  it("TCR d'origine : tout en 11v", () => {
    expect(t1Vitesses(tcrOrigine)?.statut).toBe("compatible");
  });

  it("TCR en Di2 12v : tout en 12v", () => {
    expect(t1Vitesses(tcrDi2)?.statut).toBe("compatible");
  });

  it("garder le pédalier R8000 11v en Di2 12v : non homologué → incompatible", () => {
    const r = t1Vitesses({ ...tcrDi2, pedalier: fc8000 });
    expect(r?.statut).toBe("incompatible");
    expect(r?.piecesConcernees).toEqual(["manettes", "pedalier"]);
    expect(r?.message).toContain("FC-R8000 en 11v");
  });

  it("une seule pièce : la règle ne s'applique pas", () => {
    expect(t1Vitesses({ cassette: cs8000_1130 })).toBeNull();
  });
});

describe("T2 — corps de roue libre", () => {
  it("cassette 11v sur corps HG 11v", () => {
    expect(t2CorpsRoueLibre(tcrOrigine)?.statut).toBe("compatible");
  });

  it("cassette 12v route sur corps HG 11v : homologué, pas besoin de changer de roues", () => {
    expect(t2CorpsRoueLibre(tcrDi2)?.statut).toBe("compatible");
  });

  it("roues Zipp en XDR : adaptateur = corps HG en option", () => {
    const r = t2CorpsRoueLibre({ ...tcrDi2, roues: zipp });
    expect(r?.statut).toBe("adaptateur");
    expect(r?.adaptateur).toBe("corps de roue libre Shimano HG route 11v");
  });

  it("cassette 11v sur roue HG L2 12v uniquement : incompatible", () => {
    const roues = { ...zipp, corpsRoueLibre: "hg_l2_12v_route" as const, corpsDisponibles: ["hg_l2_12v_route" as const] };
    expect(t2CorpsRoueLibre({ cassette: cs8000_1130, roues })?.statut).toBe("incompatible");
  });
});

describe("T3 — plus grand pignon", () => {
  it("11-30 avec RD-R8000-SS (max 30) : pile à la limite", () => {
    expect(t3PignonMax(tcrOrigine)?.statut).toBe("compatible");
  });

  it("11-34 avec RD-R8000-SS : 34 > 30 → incompatible", () => {
    const r = t3PignonMax({ cassette: cs8100_1134, derailleur_arriere: rd8000ss });
    expect(r?.statut).toBe("incompatible");
    expect(r?.message).toContain("34 dents > 30");
  });
});

describe("T4 — capacité du dérailleur arrière", () => {
  it("52-36 + 11-30 sur SS : 16 + 19 = 35 ≤ 35", () => {
    const r = t4Capacite(tcrOrigine);
    expect(r?.statut).toBe("compatible");
    expect(r?.message).toContain("(52 − 36) + (30 − 11) = 16 + 19 = 35 dents ≤ 35");
  });

  it("52-36 + 11-32 sur SS : 16 + 21 = 37 > 35 → incompatible", () => {
    const r = t4Capacite({ ...tcrOrigine, cassette: { ...cs8000_1130, pignonMax: 32 } });
    expect(r?.statut).toBe("incompatible");
    expect(r?.message).toContain("16 + 21 = 37 dents > 35");
  });

  it("50-34 + 11-34 sur RD-R8150 : 16 + 23 = 39 ≤ 39", () => {
    const r = t4Capacite({ pedalier: fc8100_5034, cassette: cs8100_1134, derailleur_arriere: rd8150 });
    expect(r?.statut).toBe("compatible");
    expect(r?.message).toContain("16 + 23 = 39");
  });

  it("mono-plateau : seule la cassette compte", () => {
    const r = t4Capacite({ pedalier: { ...fc8100_5034, plateaux: [40] }, cassette: cs8100_1134, derailleur_arriere: rd8150 });
    expect(r?.message).toContain("mono-plateau : (34 − 11) = 23 dents");
  });
});

describe("T5 — plateaux et dérailleur avant", () => {
  it("52-36 avec FD-R8150 (46–52, écart 16)", () => {
    expect(t5PlateauxDerailleurAvant(tcrDi2)?.statut).toBe("compatible");
  });

  it("grand plateau 53 avec FD-R8150 (max 52) : incompatible", () => {
    const r = t5PlateauxDerailleurAvant({ derailleur_avant: fd8150, pedalier: { ...fc8100_5034, plateaux: [53, 39] } });
    expect(r?.statut).toBe("incompatible");
  });

  it("52-34 : écart 18 > 16 → incompatible", () => {
    const r = t5PlateauxDerailleurAvant({ derailleur_avant: fd8150, pedalier: { ...fc8100_5034, plateaux: [52, 34] } });
    expect(r?.statut).toBe("incompatible");
    expect(r?.message).toContain("52 − 34 = 18 dents > 16");
  });

  it("dérailleur avant sur pédalier mono-plateau : incompatible", () => {
    const r = t5PlateauxDerailleurAvant({ derailleur_avant: fd8150, pedalier: { ...fc8100_5034, plateaux: [40] } });
    expect(r?.statut).toBe("incompatible");
  });
});

describe("T6 — fixation du dérailleur avant", () => {
  it("brasé sur patte brasée (TCR)", () => {
    expect(t6FixationDerailleurAvant(tcrOrigine)?.statut).toBe("compatible");
  });

  it("brasé sur cadre à collier Ø31,8 : adaptateur", () => {
    const r = t6FixationDerailleurAvant({ derailleur_avant: fd8000, cadre: cadreTest });
    expect(r?.statut).toBe("adaptateur");
    expect(r?.adaptateur).toContain("31.8");
  });

  it("collier Ø34,9 sur tube Ø31,8 : incompatible", () => {
    const fd = { ...fd8000, fixation: { type: "collier" as const, diametreMm: 34.9 } };
    expect(t6FixationDerailleurAvant({ derailleur_avant: fd, cadre: cadreTest })?.statut).toBe("incompatible");
  });

  it("collier sur patte brasée : incompatible", () => {
    const fd = { ...fd8000, fixation: { type: "collier" as const, diametreMm: 31.8 } };
    expect(t6FixationDerailleurAvant({ derailleur_avant: fd, cadre: tcr })?.statut).toBe("incompatible");
  });

  it("cadre sans fixation (1×) : incompatible", () => {
    const cadre = { ...tcr, fixationDerailleurAvant: { type: "aucune" as const } };
    expect(t6FixationDerailleurAvant({ derailleur_avant: fd8000, cadre })?.statut).toBe("incompatible");
  });
});

describe("T7 — protocole de commande", () => {
  it("tout mécanique (TCR d'origine)", () => {
    expect(t7Protocole(tcrOrigine)?.statut).toBe("compatible");
  });

  it("tout Di2 12v avec kit batterie", () => {
    expect(t7Protocole(tcrDi2)?.statut).toBe("compatible");
  });

  it("Di2 12v sans batterie ni câbles : incompatible", () => {
    const r = t7Protocole({ ...tcrDi2, electronique: undefined });
    expect(r?.statut).toBe("incompatible");
    expect(r?.piecesConcernees).toContain("electronique");
  });

  it("manettes Di2 avec dérailleur arrière mécanique : incompatible", () => {
    const r = t7Protocole({ ...tcrDi2, derailleur_arriere: rd8000ss });
    expect(r?.statut).toBe("incompatible");
    expect(r?.piecesConcernees).toEqual(["manettes", "derailleur_arriere"]);
  });

  it("kit Di2 11v sur une transmission Di2 12v : incompatible", () => {
    const r = t7Protocole({ ...tcrDi2, electronique: { ...kitDi2, protocole: "di2_11v" } });
    expect(r?.statut).toBe("incompatible");
  });
});

describe("T8 — passage des câbles", () => {
  it("TCR : passage interne Di2", () => {
    expect(t8PassageCables(tcrDi2)?.statut).toBe("compatible");
  });

  it("cadre à passage externe en Di2 : à vérifier", () => {
    expect(t8PassageCables({ ...tcrDi2, cadre: cadreTest })?.statut).toBe("a_verifier");
  });

  it("cadre interne mécanique uniquement en Di2 : incompatible", () => {
    const cadre = { ...tcr, passagesCables: ["interne_meca" as const] };
    expect(t8PassageCables({ ...tcrDi2, cadre })?.statut).toBe("incompatible");
  });

  it("mécanique sur cadre externe : compatible", () => {
    expect(t8PassageCables({ ...tcrOrigine, cadre: cadreTest })?.statut).toBe("compatible");
  });
});

describe("T9 — logement de la batterie", () => {
  it("TCR : tige propriétaire Variant → à vérifier", () => {
    const r = t9Batterie(tcrDi2);
    expect(r?.statut).toBe("a_verifier");
    expect(r?.message).toContain("Giant Variant");
  });

  it("cadre avec logement interne : compatible", () => {
    const cadre = { ...tcr, logementsBatterieDi2: ["cadre" as const] };
    expect(t9Batterie({ ...tcrDi2, cadre })?.statut).toBe("compatible");
  });

  it("aucun logement commun : incompatible", () => {
    const cadre = { ...tcr, logementsBatterieDi2: [] };
    expect(t9Batterie({ ...tcrDi2, cadre })?.statut).toBe("incompatible");
  });

  it("tige de selle connue et compatible batterie : compatible", () => {
    const tige = {
      id: "tige-test",
      categorie: "tige_selle" as const,
      marque: "Fictif",
      reference: "TIGE-27.2",
      nom: "Tige ronde 27,2 compatible batterie",
      sources: [],
      statutDonnees: "valide" as const,
      forme: { forme: "ronde" as const, diametreMm: 27.2 },
      compatibleBatterieDi2: true,
    };
    expect(t9Batterie({ ...tcrDi2, cadre: cadreTest, tige_selle: tige })?.statut).toBe("compatible");
  });

  it("pas de kit électronique : ne s'applique pas", () => {
    expect(t9Batterie(tcrOrigine)).toBeNull();
  });
});

describe("T10 — pédalier, boîtier, cadre", () => {
  it("TCR : axe 24 mm dans SM-BB72-41B sur cadre BB86", () => {
    expect(t10Boitier(tcrOrigine)?.statut).toBe("compatible");
  });

  it("boîtier BSA sur cadre BB86 : incompatible", () => {
    const r = t10Boitier({ ...tcrOrigine, boitier: pieceDe("boitier", "shimano-sm-bbr60") });
    expect(r?.statut).toBe("incompatible");
  });

  it("sans boîtier renseigné, cadre BSA : on indique lequel prévoir", () => {
    const r = t10Boitier({ pedalier: fc8000, cadre: cadreTest });
    expect(r?.statut).toBe("compatible");
    expect(r?.message).toContain("SM-BBR60");
  });

  it("cadre PF30 + axe 24 mm : adaptateur (boîtier réducteur)", () => {
    const r = t10Boitier({ pedalier: fc8000, cadre: { ...cadreTest, boitier: "pf30" } });
    expect(r?.statut).toBe("adaptateur");
  });

  it("axe inconnu de la table : à vérifier", () => {
    const r = t10Boitier({ pedalier: { ...fc8000, diametreAxeMm: 30 }, cadre: cadreTest });
    expect(r?.statut).toBe("a_verifier");
  });
});

describe("T11 — standard de chaîne", () => {
  it("chaîne Shimano HG avec cassette Shimano", () => {
    expect(t11StandardChaine(tcrDi2)?.statut).toBe("compatible");
  });

  it("chaîne SRAM Flattop avec cassette Shimano : incompatible", () => {
    const chaine = { ...tcrDi2.chaine!, standard: "sram_flattop" as const };
    expect(t11StandardChaine({ ...tcrDi2, chaine })?.statut).toBe("incompatible");
  });
});

describe("T12 — fixation du dérailleur arrière", () => {
  it("dérailleur sur patte classique", () => {
    expect(t12FixationDerailleurArriere(tcrDi2)?.statut).toBe("compatible");
  });

  it("dérailleur montage direct UDH sur patte classique : incompatible", () => {
    const rd = { ...rd8150, fixation: "udh_direct" as const };
    expect(t12FixationDerailleurArriere({ derailleur_arriere: rd, cadre: tcr })?.statut).toBe("incompatible");
  });

  it("dérailleur montage direct UDH sur cadre UDH : compatible", () => {
    const rd = { ...rd8150, fixation: "udh_direct" as const };
    const cadre = { ...tcr, patteDerailleur: "udh" as const };
    expect(t12FixationDerailleurArriere({ derailleur_arriere: rd, cadre })?.statut).toBe("compatible");
  });
});

describe("T13 — freins", () => {
  it("manettes Di2 R8170 avec étriers R8070 d'origine : même huile minérale", () => {
    expect(t13Freins(tcrDi2)?.statut).toBe("compatible");
  });

  it("étriers DOT avec manettes Shimano : incompatible", () => {
    const etriers = { ...tcrDi2.etriers!, fluide: "dot" as const };
    expect(t13Freins({ ...tcrDi2, etriers })?.statut).toBe("incompatible");
  });

  it("manettes à patins sur cadre à disque : incompatible", () => {
    const manettes = { ...tcrDi2.manettes!, frein: "patins" as const, fluide: undefined };
    expect(t13Freins({ ...tcrDi2, manettes })?.statut).toBe("incompatible");
  });
});
