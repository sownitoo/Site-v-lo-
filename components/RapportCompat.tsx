// Affiche tel quel ce que renvoie le moteur de compatibilité.

import type { Rapport } from "@/lib/compat/moteur";
import type { Statut } from "@/lib/types";
import { BadgeStatut } from "./BadgeStatut";

const ORDRE: Statut[] = ["incompatible", "adaptateur", "a_verifier", "compatible"];

export function ResumeRapport({ rapport }: { rapport: Rapport }) {
  if (rapport.resultats.length === 0) return <span className="badge neutre">Rien à vérifier</span>;
  return (
    <span className="resume">
      {ORDRE.map((statut) => {
        const n = rapport.resultats.filter((r) => r.statut === statut).length;
        return n > 0 ? (
          <span key={statut} className={`badge ${statut}`}>
            {n} × {statut === "a_verifier" ? "à vérifier" : statut}
          </span>
        ) : null;
      })}
    </span>
  );
}

export function RapportCompat({ rapport }: { rapport: Rapport }) {
  if (rapport.resultats.length === 0) {
    return <p className="message info">Pas assez de pièces renseignées pour lancer les vérifications.</p>;
  }
  return (
    <ul className="rapport">
      {rapport.resultats.map((r) => (
        <li key={r.regle}>
          <span>
            <BadgeStatut statut={r.statut} />
          </span>
          <span>
            {r.message}
            {r.adaptateur && <div className="discret">Adaptateur : {r.adaptateur}</div>}
          </span>
        </li>
      ))}
    </ul>
  );
}
