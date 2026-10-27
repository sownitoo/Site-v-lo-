"use client";

// Composant racine du parcours : tout l'état vit ici, les étapes ne font qu'afficher.
// On peut donc revenir en arrière sans rien perdre.

import { useEffect, useMemo, useReducer } from "react";
import { EMPLACEMENTS_A_VERIFIER } from "@/lib/libelles";
import { configurationDepuisIds, indexer } from "@/lib/outils-catalogue";
import { OBJECTIFS } from "@/lib/upgrade/objectifs";
import type { ChoixImposes } from "@/lib/upgrade/proposer";
import type { Emplacement, ModeleVelo, Piece } from "@/lib/types";
import { BarreEtapes, type Etape } from "./BarreEtapes";
import { ChoixVelo } from "./etape1/ChoixVelo";
import type { Verif } from "./etape2/LignePiece";
import { VerifPieces } from "./etape2/VerifPieces";
import { Upgrade } from "./etape3/Upgrade";

interface Etat {
  etape: Etape;
  marque: string;
  annee: number | null;
  veloId: string | null;
  nonListe: boolean;
  /** undefined = non renseigné, null = aucune pièce */
  ids: Partial<Record<Emplacement, string | null>>;
  verif: Partial<Record<Emplacement, Verif>>;
  objectifId: string;
  imposes: ChoixImposes;
}

type Action =
  | { type: "etape"; etape: Etape }
  | { type: "marque"; marque: string }
  | { type: "annee"; annee: number | null }
  | { type: "velo"; velo: ModeleVelo | null }
  | { type: "non_liste" }
  | { type: "verif"; emplacement: Emplacement; verif: Verif }
  | { type: "piece"; emplacement: Emplacement; id: string | null }
  | { type: "objectif"; id: string }
  | { type: "imposer"; emplacement: Emplacement; id: string | null };

const ETAT_INITIAL: Etat = {
  etape: 1,
  marque: "",
  annee: null,
  veloId: null,
  nonListe: false,
  ids: {},
  verif: {},
  objectifId: OBJECTIFS[0].id,
  imposes: {},
};

/** Pièces d'origine du modèle : null quand le modèle n'a pas de pièce à cet emplacement. */
function idsDOrigine(velo: ModeleVelo): Partial<Record<Emplacement, string | null>> {
  return Object.fromEntries(EMPLACEMENTS_A_VERIFIER.map((e) => [e, velo.composants[e] ?? null]));
}

function reducteur(etat: Etat, action: Action): Etat {
  switch (action.type) {
    case "etape":
      return { ...etat, etape: action.etape };
    case "marque":
      return { ...etat, marque: action.marque, annee: null, veloId: null };
    case "annee":
      return { ...etat, annee: action.annee, veloId: null };
    case "velo":
      if (action.velo?.id === etat.veloId && !etat.nonListe) return etat;
      return {
        ...etat,
        veloId: action.velo?.id ?? null,
        nonListe: false,
        ids: action.velo ? idsDOrigine(action.velo) : {},
        verif: {},
        imposes: {},
      };
    case "non_liste":
      return {
        ...etat,
        etape: 2,
        marque: "",
        annee: null,
        veloId: null,
        nonListe: true,
        ids: etat.nonListe ? etat.ids : {},
        verif: etat.nonListe ? etat.verif : {},
        imposes: {},
      };
    case "verif":
      return { ...etat, verif: { ...etat.verif, [action.emplacement]: action.verif } };
    case "piece":
      // La configuration change : les choix faits à l'étape 3 ne tiennent plus
      return {
        ...etat,
        ids: { ...etat.ids, [action.emplacement]: action.id },
        verif: { ...etat.verif, [action.emplacement]: "change" },
        imposes: {},
      };
    case "objectif":
      return { ...etat, objectifId: action.id, imposes: {} };
    case "imposer":
      return { ...etat, imposes: { ...etat.imposes, [action.emplacement]: action.id } };
  }
}

export function Configurateur({ catalogue, velos }: { catalogue: Piece[]; velos: ModeleVelo[] }) {
  const [etat, dispatch] = useReducer(reducteur, ETAT_INITIAL);
  const index = useMemo(() => indexer(catalogue), [catalogue]);
  const velo = velos.find((v) => v.id === etat.veloId) ?? null;
  const config = useMemo(() => configurationDepuisIds(etat.ids, index), [etat.ids, index]);

  const veloDefini = velo !== null || etat.nonListe;
  const aller = (e: Etape) => dispatch({ type: "etape", etape: e });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etat.etape]);

  return (
    <main>
      <h1>Configurateur vélo</h1>
      <p className="discret">Upgrade de vélo de route : on part de ton vélo, on te propose les pièces compatibles.</p>

      <BarreEtapes etape={etat.etape} accessibles={{ 1: true, 2: veloDefini, 3: veloDefini }} onChanger={aller} />

      {etat.etape === 1 && (
        <ChoixVelo
          velos={velos}
          index={index}
          selection={{ marque: etat.marque, annee: etat.annee, veloId: etat.veloId }}
          onMarque={(marque) => dispatch({ type: "marque", marque })}
          onAnnee={(annee) => dispatch({ type: "annee", annee })}
          onVelo={(id) => dispatch({ type: "velo", velo: velos.find((v) => v.id === id) ?? null })}
          onNonListe={() => dispatch({ type: "non_liste" })}
          onSuivant={() => aller(2)}
        />
      )}

      {etat.etape === 2 && (
        <VerifPieces
          velo={velo}
          config={config}
          ids={etat.ids}
          verif={etat.verif}
          catalogue={catalogue}
          index={index}
          onVerif={(emplacement, v) => dispatch({ type: "verif", emplacement, verif: v })}
          onChoisir={(emplacement, id) => dispatch({ type: "piece", emplacement, id })}
          onRetour={() => aller(1)}
          onSuivant={() => aller(3)}
        />
      )}

      {etat.etape === 3 && (
        <Upgrade
          config={config}
          catalogue={catalogue}
          objectifId={etat.objectifId}
          imposes={etat.imposes}
          onObjectif={(id) => dispatch({ type: "objectif", id })}
          onImposer={(emplacement, id) => dispatch({ type: "imposer", emplacement, id })}
          onRetour={() => aller(2)}
        />
      )}
    </main>
  );
}
