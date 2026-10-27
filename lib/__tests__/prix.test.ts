import { describe, expect, it } from "vitest";
import { totalAchats, type LigneAchat } from "@/lib/prix";

const piece = (libelle: string, prixEur?: number): LigneAchat => ({ type: "piece", libelle, prixEur });

describe("totalAchats", () => {
  it("additionne les prix connus", () => {
    // 449,99 + 329,95 + 59,90 = 839,84 €
    expect(totalAchats([piece("manettes", 449.99), piece("dérailleur", 329.95), piece("chaîne", 59.9)])).toEqual({
      totalEur: 839.84,
      nbSansPrix: 0,
      complet: true,
    });
  });

  it("arrondit au centime (pas d'erreur de virgule flottante)", () => {
    // 0,1 + 0,2 = 0,30000000000000004 en flottant
    expect(totalAchats([piece("a", 0.1), piece("b", 0.2)]).totalEur).toBe(0.3);
  });

  it("prix manquant : compté à part, le total reste celui des prix connus", () => {
    const t = totalAchats([piece("manettes", 450), piece("batterie"), { type: "adaptateur", libelle: "corps HG" }]);
    expect(t).toEqual({ totalEur: 450, nbSansPrix: 2, complet: false });
  });

  it("prix invalide (négatif, NaN) : traité comme non renseigné", () => {
    expect(totalAchats([piece("a", -10), piece("b", Number.NaN), piece("c", 20)])).toEqual({
      totalEur: 20,
      nbSansPrix: 2,
      complet: false,
    });
  });

  it("aucun achat : 0 €, total complet", () => {
    expect(totalAchats([])).toEqual({ totalEur: 0, nbSansPrix: 0, complet: true });
  });

  it("catalogue actuel sans aucun prix : 0 € et toutes les lignes sans prix", () => {
    expect(totalAchats([piece("a"), piece("b"), piece("c")])).toEqual({ totalEur: 0, nbSansPrix: 3, complet: false });
  });
});
