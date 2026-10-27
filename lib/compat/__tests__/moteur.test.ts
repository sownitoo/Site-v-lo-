import { describe, expect, it } from "vitest";
import { catalogue, pieceDe, velos } from "@/lib/catalogue";
import { verifier } from "@/lib/compat/moteur";
import { tcrDi2, tcrOrigine, valider } from "./fixtures";

describe("moteur", () => {
  it("fiches non validées : jamais « compatible », au mieux « à vérifier »", () => {
    const rapport = verifier(tcrOrigine);
    expect(rapport.resultats.some((r) => r.statut === "compatible")).toBe(false);
    expect(rapport.statutGlobal).toBe("a_verifier");
  });

  it("TCR d'origine, fiches validées : tout compatible", () => {
    const rapport = verifier(valider(tcrOrigine));
    expect(rapport.statutGlobal).toBe("compatible");
  });

  it("TCR en Di2 12v, fiches validées : seul le support batterie reste à vérifier", () => {
    const rapport = verifier(valider(tcrDi2));
    expect(rapport.statutGlobal).toBe("a_verifier");
    const nonCompatibles = rapport.resultats.filter((r) => r.statut !== "compatible").map((r) => r.regle);
    expect(nonCompatibles).toEqual(["T9_batterie"]);
  });

  it("TCR en Di2 12v en gardant le pédalier 11v : incompatible", () => {
    const rapport = verifier(valider({ ...tcrDi2, pedalier: pieceDe("pedalier", "shimano-fc-r8000-52-36") }));
    expect(rapport.statutGlobal).toBe("incompatible");
  });
});

describe("catalogue", () => {
  it("identifiants uniques", () => {
    const ids = catalogue.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque composant d'un vélo existe et est dans la bonne catégorie", () => {
    for (const velo of velos) {
      for (const [emplacement, id] of Object.entries(velo.composants)) {
        const p = catalogue.find((x) => x.id === id);
        expect(p, `${velo.id} → ${id}`).toBeDefined();
        expect(p?.categorie).toBe(emplacement);
      }
    }
  });
});
