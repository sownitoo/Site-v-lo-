import { describe, expect, it } from "vitest";
import { catalogue } from "@/lib/catalogue";
import { normaliser, rechercherReference } from "@/lib/recherche";

const refs = (r: ReturnType<typeof rechercherReference>) =>
  r.type === "trouve" || r.type === "autre_categorie" ? r.pieces.map((p) => p.id).sort() : [];

describe("normaliser", () => {
  it("ignore majuscules, espaces, tirets et symboles", () => {
    expect(normaliser(" rd r8000-ss ")).toBe("RDR8000SS");
    expect(normaliser("RD_R8000.SS")).toBe("RDR8000SS");
    expect(normaliser("BT-DN300 + EW-SD300")).toBe("BTDN300EWSD300");
  });
});

describe("rechercherReference", () => {
  it("retrouve une référence exacte, quelle que soit la façon de l'écrire", () => {
    for (const saisie of ["RD-R8150", "rd-r8150", "rd r8150", "RDR8150", " Rd - R8150 "]) {
      const r = rechercherReference(saisie, "derailleur_arriere", catalogue);
      expect(r.type, saisie).toBe("trouve");
      expect(refs(r)).toEqual(["shimano-rd-r8150"]);
    }
  });

  it("référence partielle gravée (RD-R8000) : propose les deux chapes", () => {
    const r = rechercherReference("RD-R8000", "derailleur_arriere", catalogue);
    expect(r.type).toBe("trouve");
    expect(refs(r)).toEqual(["shimano-rd-r8000-gs", "shimano-rd-r8000-ss"]);
  });

  it("l'égalité exacte passe avant le début de référence", () => {
    const r = rechercherReference("RD-R8000-SS", "derailleur_arriere", catalogue);
    expect(refs(r)).toEqual(["shimano-rd-r8000-ss"]);
  });

  it("même référence pour plusieurs dentures (FC-R8100) : renvoie les deux", () => {
    const r = rechercherReference("fc-r8100", "pedalier", catalogue);
    expect(refs(r)).toEqual(["shimano-fc-r8100-50-34", "shimano-fc-r8100-52-36"]);
  });

  it("référence d'une autre catégorie : le signale", () => {
    const r = rechercherReference("RD-R8000", "cassette", catalogue);
    expect(r.type).toBe("autre_categorie");
    expect(refs(r)).toEqual(["shimano-rd-r8000-gs", "shimano-rd-r8000-ss"]);
  });

  it("référence inconnue : renvoie la saisie pour l'afficher", () => {
    expect(rechercherReference("RD-R9999", "derailleur_arriere", catalogue)).toEqual({
      type: "inconnue",
      saisie: "RD-R9999",
    });
  });

  it("saisie trop courte : pas de recherche par début de référence", () => {
    expect(rechercherReference("RD", "derailleur_arriere", catalogue).type).toBe("inconnue");
  });

  it("saisie vide", () => {
    expect(rechercherReference("  - ", "cassette", catalogue)).toEqual({ type: "vide" });
  });
});
