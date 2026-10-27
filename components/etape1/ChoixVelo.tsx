import { annees, marques, modeles } from "@/lib/outils-catalogue";
import type { ModeleVelo, Piece } from "@/lib/types";
import { FicheVelo } from "./FicheVelo";

export interface SelectionVelo {
  marque: string;
  annee: number | null;
  veloId: string | null;
}

export function ChoixVelo({
  velos,
  index,
  selection,
  onMarque,
  onAnnee,
  onVelo,
  onNonListe,
  onSuivant,
}: {
  velos: ModeleVelo[];
  index: Map<string, Piece>;
  selection: SelectionVelo;
  onMarque: (marque: string) => void;
  onAnnee: (annee: number | null) => void;
  onVelo: (veloId: string | null) => void;
  onNonListe: () => void;
  onSuivant: () => void;
}) {
  const { marque, annee, veloId } = selection;
  const listeAnnees = marque ? annees(velos, marque) : [];
  const listeModeles = marque && annee !== null ? modeles(velos, marque, annee) : [];
  const velo = velos.find((v) => v.id === veloId);

  return (
    <section aria-labelledby="titre-etape1">
      <h2 id="titre-etape1">1. Identifier mon vélo</h2>
      <div className="champs">
        <div>
          <label htmlFor="marque">Marque</label>
          <select id="marque" value={marque} onChange={(e) => onMarque(e.target.value)}>
            <option value="">— Choisir —</option>
            {marques(velos).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee">Année</label>
          <select
            id="annee"
            value={annee ?? ""}
            disabled={!marque}
            onChange={(e) => onAnnee(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Choisir —</option>
            {listeAnnees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modele">Modèle</label>
          <select
            id="modele"
            value={veloId ?? ""}
            disabled={annee === null}
            onChange={(e) => onVelo(e.target.value || null)}
          >
            <option value="">— Choisir —</option>
            {listeModeles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.modele}
              </option>
            ))}
          </select>
        </div>
      </div>

      {velo && (
        <div style={{ marginTop: 16 }}>
          <FicheVelo velo={velo} index={index} />
        </div>
      )}

      <div className="navigation">
        <button type="button" className="btn" onClick={onNonListe}>
          Mon vélo n&apos;est pas listé
        </button>
        <button type="button" className="btn btn-principal" disabled={!velo} onClick={onSuivant}>
          Vérifier mes pièces →
        </button>
      </div>
    </section>
  );
}
