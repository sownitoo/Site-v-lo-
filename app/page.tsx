// Aperçu provisoire : le moteur de compatibilité sur le Giant TCR 2020, d'origine puis en Di2 12v.
// Les 3 étapes (identifier / vérifier / upgrader) viendront remplacer cette page.

import { configurationDepuisVelo, pieceDe, velos } from "@/lib/catalogue";
import { verifier } from "@/lib/compat/moteur";
import type { Configuration, Statut } from "@/lib/types";

const LIBELLE: Record<Statut, string> = {
  compatible: "✓ compatible",
  adaptateur: "⚠ adaptateur",
  a_verifier: "? à vérifier",
  incompatible: "✗ incompatible",
};

function Rapport({ titre, config }: { titre: string; config: Configuration }) {
  const { statutGlobal, resultats } = verifier(config);
  return (
    <section>
      <h2>
        {titre} — <span className={`badge ${statutGlobal}`}>{LIBELLE[statutGlobal]}</span>
      </h2>
      <table>
        <tbody>
          {resultats.map((r) => (
            <tr key={r.regle}>
              <td className={`badge ${r.statut}`}>{LIBELLE[r.statut]}</td>
              <td>
                {r.message}
                {r.adaptateur && <div className="discret">Adaptateur : {r.adaptateur}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Page() {
  const velo = velos[0];
  const origine = configurationDepuisVelo(velo);
  const di2: Configuration = {
    ...origine,
    manettes: pieceDe("manettes", "shimano-st-r8170"),
    derailleur_arriere: pieceDe("derailleur_arriere", "shimano-rd-r8150"),
    derailleur_avant: pieceDe("derailleur_avant", "shimano-fd-r8150"),
    pedalier: pieceDe("pedalier", "shimano-fc-r8100-52-36"),
    cassette: pieceDe("cassette", "shimano-cs-r8100-11-30"),
    chaine: pieceDe("chaine", "shimano-cn-m8100"),
    electronique: pieceDe("electronique", "shimano-di2-12v-bt-dn300"),
  };

  return (
    <main>
      <h1>Configurateur vélo</h1>
      <p className="discret">
        {velo.marque} {velo.modele} {velo.annee}. Fiches pas encore validées à la main, donc rien n&apos;est
        affiché « compatible » pour l&apos;instant.
      </p>
      <Rapport titre="D'origine (Ultegra R8000 11v)" config={origine} />
      <Rapport titre="Passage en Ultegra Di2 R8150 12v" config={di2} />
    </main>
  );
}
