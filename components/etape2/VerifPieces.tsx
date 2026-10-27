"use client";

import { verifier } from "@/lib/compat/moteur";
import { EMPLACEMENTS_A_VERIFIER } from "@/lib/libelles";
import type { Configuration, Emplacement, ModeleVelo, Piece } from "@/lib/types";
import { RapportCompat, ResumeRapport } from "../RapportCompat";
import { LignePiece, type Verif } from "./LignePiece";

export function VerifPieces({
  velo,
  config,
  ids,
  verif,
  catalogue,
  index,
  onVerif,
  onChoisir,
  onRetour,
  onSuivant,
}: {
  /** null = vélo non listé (fiche vide) */
  velo: ModeleVelo | null;
  config: Configuration;
  /** undefined = non renseigné, null = aucune pièce */
  ids: Partial<Record<Emplacement, string | null>>;
  verif: Partial<Record<Emplacement, Verif>>;
  catalogue: Piece[];
  index: Map<string, Piece>;
  onVerif: (e: Emplacement, v: Verif) => void;
  onChoisir: (e: Emplacement, id: string | null) => void;
  onRetour: () => void;
  onSuivant: () => void;
}) {
  const rapport = verifier(config);
  const nbAConfirmer = EMPLACEMENTS_A_VERIFIER.filter((e) => !verif[e]).length;

  const pieceDepuisId = (id: string | null | undefined): Piece | null | undefined =>
    id === undefined ? undefined : id === null ? null : index.get(id);

  return (
    <section aria-labelledby="titre-etape2">
      <h2 id="titre-etape2">2. Vérifier mes pièces</h2>
      <p className="discret">
        {velo
          ? `${velo.marque} ${velo.modele} ${velo.annee} : confirme chaque pièce ou indique ce que tu as changé.`
          : "Vélo non listé : renseigne tes pièces depuis le catalogue ou avec la référence gravée."}
      </p>

      <div className="carte" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <strong>Compatibilité actuelle :</strong>
        <ResumeRapport rapport={rapport} />
        <a href="#rapport-etape2" className="discret">
          voir le détail
        </a>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {EMPLACEMENTS_A_VERIFIER.map((e) => (
          <LignePiece
            key={e}
            emplacement={e}
            actuelle={pieceDepuisId(ids[e])}
            origine={velo ? pieceDepuisId(velo.composants[e] ?? null) : undefined}
            verif={verif[e]}
            piecesCategorie={catalogue.filter((p) => p.categorie === e)}
            catalogue={catalogue}
            onOk={() => onVerif(e, "ok")}
            onChange={() => onVerif(e, "change")}
            onChoisir={(id) => onChoisir(e, id)}
            onOrigine={() => onChoisir(e, velo?.composants[e] ?? null)}
          />
        ))}
      </ul>

      <h2 id="rapport-etape2">Vérification en direct</h2>
      <RapportCompat rapport={rapport} />

      <div className="navigation">
        <button type="button" className="btn" onClick={onRetour}>
          ← Mon vélo
        </button>
        <button type="button" className="btn btn-principal" onClick={onSuivant}>
          Mon upgrade →
        </button>
      </div>
      {nbAConfirmer > 0 && (
        <p className="discret" style={{ marginTop: 8 }}>
          {nbAConfirmer} pièce{nbAConfirmer > 1 ? "s" : ""} pas encore confirmée{nbAConfirmer > 1 ? "s" : ""} : tu
          peux continuer, mais l&apos;upgrade se basera sur ce qui est affiché.
        </p>
      )}
    </section>
  );
}
