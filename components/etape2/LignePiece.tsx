"use client";

import { useId, useState, type FormEvent } from "react";
import { NOM_EMPLACEMENT } from "@/lib/libelles";
import { rechercherReference, type ResultatRecherche } from "@/lib/recherche";
import type { Emplacement, Piece } from "@/lib/types";

export type Verif = "ok" | "change";

const AUCUNE = "__aucune__";

function NomPiece({ piece }: { piece: Piece | null | undefined }) {
  if (piece === undefined) return <span className="discret">Non renseigné</span>;
  if (piece === null) return <span className="discret">Aucune</span>;
  return (
    <>
      {piece.nom} <span className="piece-ref">({piece.reference})</span>
    </>
  );
}

export function LignePiece({
  emplacement,
  actuelle,
  origine,
  verif,
  piecesCategorie,
  catalogue,
  onOk,
  onChange,
  onChoisir,
  onOrigine,
}: {
  emplacement: Emplacement;
  /** undefined = non renseigné, null = aucune pièce */
  actuelle: Piece | null | undefined;
  /** Pièce d'origine du modèle choisi (undefined si vélo non listé) */
  origine: Piece | null | undefined;
  verif: Verif | undefined;
  piecesCategorie: Piece[];
  catalogue: Piece[];
  onOk: () => void;
  onChange: () => void;
  onChoisir: (id: string | null) => void;
  onOrigine: () => void;
}) {
  const id = useId();
  const [saisie, setSaisie] = useState("");
  const [resultat, setResultat] = useState<ResultatRecherche | null>(null);

  const nom = NOM_EMPLACEMENT[emplacement];
  const etat = verif === "ok" ? "Confirmée" : verif === "change" ? "Modifiée" : "À confirmer";
  const differenteDeOrigine = origine !== undefined && (actuelle?.id ?? null) !== (origine?.id ?? null);

  function chercher(e: FormEvent) {
    e.preventDefault();
    const r = rechercherReference(saisie, emplacement, catalogue);
    setResultat(r);
    if (r.type === "trouve" && r.pieces.length === 1) onChoisir(r.pieces[0].id);
  }

  return (
    <li className="carte">
      <div className="carte-tete">
        <h3>{nom}</h3>
        <span className="badge neutre">{etat}</span>
      </div>
      <p className="piece-nom">
        <NomPiece piece={actuelle} />
      </p>

      <div className="actions" role="group" aria-label={`${nom} : vérification`}>
        <button
          type="button"
          className="btn"
          aria-pressed={verif === "ok"}
          disabled={actuelle === undefined}
          title={actuelle === undefined ? "Renseigne d'abord la pièce" : undefined}
          onClick={onOk}
        >
          C&apos;est bon
        </button>
        <button type="button" className="btn" aria-pressed={verif === "change"} onClick={onChange}>
          J&apos;ai changé
        </button>
      </div>

      {verif === "change" && (
        <div className="edition">
          <div>
            <label htmlFor={`${id}-select`}>Choisir dans le catalogue</label>
            <select
              id={`${id}-select`}
              value={actuelle === undefined ? "" : actuelle === null ? AUCUNE : actuelle.id}
              onChange={(e) => onChoisir(e.target.value === AUCUNE ? null : e.target.value)}
            >
              {actuelle === undefined && <option value="">— Choisir —</option>}
              <option value={AUCUNE}>Aucune pièce</option>
              {piecesCategorie.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.reference})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={chercher}>
            <label htmlFor={`${id}-ref`}>Ou taper la référence gravée sur la pièce</label>
            <div className="champ-recherche">
              <input
                id={`${id}-ref`}
                type="text"
                placeholder="ex. RD-R8000"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={saisie}
                onChange={(e) => {
                  setSaisie(e.target.value);
                  setResultat(null);
                }}
              />
              <button type="submit" className="btn">
                Chercher
              </button>
            </div>
          </form>

          <ResultatRef resultat={resultat} nom={nom} onChoisir={onChoisir} actuelleId={actuelle?.id} />

          {differenteDeOrigine && (
            <button type="button" className="btn-lien" onClick={onOrigine}>
              Revenir à la pièce d&apos;origine
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function ResultatRef({
  resultat,
  nom,
  actuelleId,
  onChoisir,
}: {
  resultat: ResultatRecherche | null;
  nom: string;
  actuelleId: string | undefined;
  onChoisir: (id: string) => void;
}) {
  if (!resultat || resultat.type === "vide") return null;

  if (resultat.type === "inconnue") {
    return (
      <p className="message erreur" role="alert">
        Référence inconnue : « {resultat.saisie} » n&apos;est pas dans le catalogue. Vérifie la gravure, ou choisis
        dans la liste.
      </p>
    );
  }
  if (resultat.type === "autre_categorie") {
    const liste = resultat.pieces.map((p) => p.reference).join(", ");
    return (
      <p className="message alerte" role="alert">
        Cette référence correspond à une autre pièce ({liste}), pas à : {nom.toLowerCase()}.
      </p>
    );
  }
  if (resultat.pieces.length === 1) {
    const p = resultat.pieces[0];
    return (
      <p className="message info" role="status">
        Trouvé : {p.nom} ({p.reference})
      </p>
    );
  }
  return (
    <div role="status">
      <p className="discret">Plusieurs pièces correspondent, choisis la tienne :</p>
      <ul className="resultats-recherche">
        {resultat.pieces.map((p) => (
          <li key={p.id}>
            <button type="button" className="btn" aria-pressed={p.id === actuelleId} onClick={() => onChoisir(p.id)}>
              {p.nom} ({p.reference})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
