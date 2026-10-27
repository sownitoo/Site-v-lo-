import { describe, expect, it } from "vitest";
import { catalogue, pieceDe, velos } from "@/lib/catalogue";
import { annees, marques, modeles } from "@/lib/outils-catalogue";
import { objectifParId } from "@/lib/upgrade/objectifs";
import { proposer } from "@/lib/upgrade/proposer";
import { tcrDi2, tcrOrigine } from "@/lib/compat/__tests__/fixtures";

const di2 = objectifParId("shimano_di2_12v")!;
const idPropose = (p: ReturnType<typeof proposer>, e: string) =>
  p.changements.find((c) => c.emplacement === e)?.proposee?.id;

describe("proposer — Passer en Shimano Di2 12v", () => {
  const p = proposer(tcrOrigine, di2, catalogue);

  it("TCR d'origine : une solution sans incompatible existe", () => {
    expect(p.sansIncompatible).toBe(true);
    expect(p.rapport.resultats.some((r) => r.statut === "incompatible")).toBe(false);
  });

  it("remplace manettes, dérailleurs, et ajoute la batterie", () => {
    expect(idPropose(p, "manettes")).toBe("shimano-st-r8170");
    expect(idPropose(p, "derailleur_arriere")).toBe("shimano-rd-r8150");
    expect(idPropose(p, "derailleur_avant")).toBe("shimano-fd-r8150");
    expect(p.changements.find((c) => c.emplacement === "electronique")?.action).toBe("ajouter");
  });

  it("pédalier 11v non homologué en 12v : remplacé, en gardant les mêmes dentures 52-36", () => {
    const c = p.changements.find((x) => x.emplacement === "pedalier");
    expect(c?.action).toBe("remplacer");
    expect(c?.proposee?.id).toBe("shimano-fc-r8100-52-36");
  });

  it("garde le boîtier et les étriers, et ne touche pas aux roues", () => {
    expect(p.changements.find((c) => c.emplacement === "boitier")?.action).toBe("garder");
    expect(p.changements.find((c) => c.emplacement === "etriers")?.action).toBe("garder");
    expect(p.config.roues?.id).toBe("giant-slr-1-42-disc");
  });

  it("cassette : 11-30 proposée (même denture), 11-34 en alternative", () => {
    expect(idPropose(p, "cassette")).toBe("shimano-cs-r8100-11-30");
    expect(p.alternatives.cassette?.map((x) => x?.id)).toContain("shimano-cs-r8100-11-34");
  });

  it("7 pièces à acheter, aucun adaptateur", () => {
    expect(p.achats).toHaveLength(7);
    expect(p.adaptateurs).toHaveLength(0);
  });

  it("un choix imposé (cassette 11-34) est respecté", () => {
    const q = proposer(tcrOrigine, di2, catalogue, { cassette: "shimano-cs-r8100-11-34" });
    expect(idPropose(q, "cassette")).toBe("shimano-cs-r8100-11-34");
    expect(q.sansIncompatible).toBe(true);
  });

  it("vélo déjà en Di2 12v : rien à acheter", () => {
    expect(proposer(tcrDi2, di2, catalogue).achats).toHaveLength(0);
  });

  it("vélo non listé (fiche vide) : propose quand même les pièces exigées par l'objectif", () => {
    const q = proposer({}, di2, catalogue);
    expect(q.achats.map((a) => a.emplacement)).toEqual(["manettes", "derailleur_arriere", "derailleur_avant", "electronique"]);
  });

  it("mono-plateau sans dérailleur avant : on n'en ajoute pas", () => {
    const pedalier1x = { ...pieceDe("pedalier", "shimano-fc-r8100-50-34"), plateaux: [40] };
    const q = proposer({ ...tcrDi2, pedalier: pedalier1x, derailleur_avant: undefined }, di2, catalogue);
    expect(q.changements.find((c) => c.emplacement === "derailleur_avant")?.proposee).toBeUndefined();
  });

  it("roues en corps XDR : l'adaptateur (corps HG) apparaît dans les achats", () => {
    const q = proposer({ ...tcrOrigine, roues: pieceDe("roues", "zipp-303-s-xdr") }, di2, catalogue);
    expect(q.adaptateurs.map((a) => a.regle)).toEqual(["T2_corps_roue_libre"]);
    expect(q.achats.filter((a) => a.type === "adaptateur")).toHaveLength(1);
  });
});

describe("menus en cascade", () => {
  it("marque → année → modèle depuis data/velos", () => {
    expect(marques(velos)).toEqual(["Giant"]);
    expect(annees(velos, "Giant")).toEqual([2020]);
    expect(modeles(velos, "Giant", 2020).map((v) => v.id)).toEqual(["giant-tcr-advanced-pro-1-disc-2020"]);
    expect(annees(velos, "Inconnue")).toEqual([]);
  });
});
