"use client";

import { useMemo } from "react";
import { NOM_EMPLACEMENT } from "@/lib/libelles";
import { OBJECTIFS, objectifParId } from "@/lib/upgrade/objectifs";
import { proposer, type Action, type ChoixImposes, type Changement } from "@/lib/upgrade/proposer";
import type { Configuration, Emplacement, Piece } from "@/lib/types";
import { RapportCompat, ResumeRapport } from "../RapportCompat";
import { TableauAchats } from "./TableauAchats";

const AUCUNE = "__aucune__";

const LIBELLE_ACTION: Record<Action, string> = {
  garder: "Gardée",
  remplacer: "À remplacer",
  ajouter: "À ajouter",
};

function libellePiece(p: Piece | null | undefined): string {
  return p ? `${p.nom} (${p.reference})` : "Aucune";
}

function LigneChangement({
  changement,
  alternatives,
  onImposer,
}: {
  changement: Changement;
  alternatives: (Piece | null)[];
  onImposer: (id: string | null) => void;
}) {
  const { emplacement, actuelle, proposee, action } = changement;
  const idSelect = `alt-${emplacement}`;
  const nonRenseignee = action === "garder" && !proposee;
  return (
    <li className="carte">
      <div className="carte-tete">
        <h3>{NOM_EMPLACEMENT[emplacement]}</h3>
        <span className={`badge ${action === "garder" ? "neutre" : "action"}`}>
          {nonRenseignee ? "Non renseignée" : LIBELLE_ACTION[action]}
        </span>
      </div>
      {nonRenseignee ? (
        <p className="piece-nom discret">Renseigne cette pièce à l&apos;étape 2 pour qu&apos;elle soit vérifiée.</p>
      ) : action === "garder" ? (
        <p className="piece-nom">{libellePiece(proposee)}</p>
      ) : (
        <p className="piece-nom">
          {actuelle && (
            <>
              <s className="discret">{libellePiece(actuelle)}</s>
              <br />
            </>
          )}
          → {libellePiece(proposee)}
        </p>
      )}
      {alternatives.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <label htmlFor={idSelect}>Autres choix compatibles</label>
          <select
            id={idSelect}
            value={proposee?.id ?? AUCUNE}
            onChange={(e) => onImposer(e.target.value === AUCUNE ? null : e.target.value)}
          >
            {alternatives.map((p) => (
              <option key={p?.id ?? AUCUNE} value={p?.id ?? AUCUNE}>
                {p?.id === actuelle?.id ? `${libellePiece(p)} — ma pièce actuelle` : libellePiece(p)}
              </option>
            ))}
          </select>
        </div>
      )}
    </li>
  );
}

export function Upgrade({
  config,
  catalogue,
  objectifId,
  imposes,
  onObjectif,
  onImposer,
  onRetour,
}: {
  config: Configuration;
  catalogue: Piece[];
  objectifId: string;
  imposes: ChoixImposes;
  onObjectif: (id: string) => void;
  onImposer: (e: Emplacement, id: string | null) => void;
  onRetour: () => void;
}) {
  const objectif = objectifParId(objectifId) ?? OBJECTIFS[0];
  const proposition = useMemo(
    () => proposer(config, objectif, catalogue, imposes),
    [config, objectif, catalogue, imposes],
  );
  const nbAchats = proposition.achats.length;
  const autresEmplacements = (Object.keys(config) as Emplacement[]).filter(
    (e) => !proposition.changements.some((c) => c.emplacement === e),
  );

  return (
    <section aria-labelledby="titre-etape3">
      <h2 id="titre-etape3">3. Mon upgrade</h2>

      <fieldset className="carte" style={{ margin: "0 0 10px" }}>
        <legend style={{ fontWeight: 600, padding: "0 4px" }}>Objectif</legend>
        <div className="objectifs">
          {OBJECTIFS.map((o) => (
            <label key={o.id} className="objectif">
              <input
                type="radio"
                name="objectif"
                value={o.id}
                checked={o.id === objectif.id}
                onChange={() => onObjectif(o.id)}
              />
              <span>
                <strong>{o.libelle}</strong>
                <br />
                <span className="discret">{o.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!proposition.sansIncompatible && (
        <p className="message erreur" role="alert">
          Aucune combinaison du catalogue actuel n&apos;évite toutes les incompatibilités. Voici la moins mauvaise :
          regarde les lignes en rouge plus bas.
        </p>
      )}
      {nbAchats === 0 && proposition.sansIncompatible && (
        <p className="message info">Ton vélo correspond déjà à cet objectif : rien à changer.</p>
      )}

      <h2>Pièces proposées</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {proposition.changements.map((c) => (
          <LigneChangement
            key={c.emplacement}
            changement={c}
            alternatives={proposition.alternatives[c.emplacement] ?? []}
            onImposer={(id) => onImposer(c.emplacement, id)}
          />
        ))}
      </ul>
      {autresEmplacements.length > 0 && (
        <p className="discret">
          Gardés tels quels : {autresEmplacements.map((e) => NOM_EMPLACEMENT[e].toLowerCase()).join(", ")}.
        </p>
      )}

      {proposition.adaptateurs.length > 0 && (
        <>
          <h2>Adaptateurs nécessaires</h2>
          <ul className="carte" style={{ paddingLeft: 32 }}>
            {proposition.adaptateurs.map((a) => (
              <li key={a.regle}>
                <strong>{a.adaptateur}</strong>
                <div className="discret">{a.message}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Vérification de la nouvelle configuration</h2>
      <div style={{ marginBottom: 8 }}>
        <ResumeRapport rapport={proposition.rapport} />
      </div>
      <RapportCompat rapport={proposition.rapport} />

      <h2>Récapitulatif</h2>
      <TableauAchats achats={proposition.achats} />

      <div className="navigation">
        <button type="button" className="btn" onClick={onRetour}>
          ← Mes pièces
        </button>
      </div>
    </section>
  );
}
