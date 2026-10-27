// Configurations de test construites à partir du vrai catalogue.

import { configurationDepuisVelo, pieceDe, velos } from "@/lib/catalogue";
import type { Configuration, Piece } from "@/lib/types";

/** Giant TCR Advanced Pro 1 Disc 2020, tel que livré (Ultegra R8000 mécanique 11v). */
export const tcrOrigine: Configuration = configurationDepuisVelo(velos[0]);

/** Le même vélo après passage en Ultegra Di2 R8150 12v (roues et étriers conservés). */
export const tcrDi2: Configuration = {
  ...tcrOrigine,
  manettes: pieceDe("manettes", "shimano-st-r8170"),
  derailleur_arriere: pieceDe("derailleur_arriere", "shimano-rd-r8150"),
  derailleur_avant: pieceDe("derailleur_avant", "shimano-fd-r8150"),
  pedalier: pieceDe("pedalier", "shimano-fc-r8100-52-36"),
  cassette: pieceDe("cassette", "shimano-cs-r8100-11-30"),
  chaine: pieceDe("chaine", "shimano-cn-m8100"),
  electronique: pieceDe("electronique", "shimano-di2-12v-bt-dn300"),
};

export const cadreTest = pieceDe("cadre", "test-cadre-alu-bsa");

/** Toutes les fiches passées en "valide" (pour tester le moteur sans le déclassement a_verifier). */
export function valider(config: Configuration): Configuration {
  const res: Record<string, Piece> = {};
  for (const [e, p] of Object.entries(config)) {
    if (p) res[e] = { ...p, statutDonnees: "valide" };
  }
  return res as Configuration;
}
