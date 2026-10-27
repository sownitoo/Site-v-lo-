import { EMPLACEMENTS_A_VERIFIER, NOM_EMPLACEMENT } from "@/lib/libelles";
import type { ModeleVelo, Piece } from "@/lib/types";

export function FicheVelo({ velo, index }: { velo: ModeleVelo; index: Map<string, Piece> }) {
  const composants = EMPLACEMENTS_A_VERIFIER.flatMap((e) => {
    const id = velo.composants[e];
    const p = id ? index.get(id) : undefined;
    return p ? [{ e, p }] : [];
  });

  return (
    <section className="carte" aria-labelledby="fiche-titre">
      <h2 id="fiche-titre" style={{ marginTop: 0 }}>
        {velo.marque} {velo.modele}
      </h2>
      <p className="discret">
        Année {velo.annee}
        {velo.statutDonnees === "a_verifier" && " · fiche pas encore validée à la main"}
      </p>
      <h3>Composants d&apos;origine</h3>
      <ul className="liste-composants">
        {composants.map(({ e, p }) => (
          <li key={e}>
            <span className="discret">{NOM_EMPLACEMENT[e]}</span>
            <span>
              {p.nom} <span className="piece-ref">({p.reference})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
