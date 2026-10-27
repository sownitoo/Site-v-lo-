// Page serveur : lit /data au build et passe le catalogue au configurateur (composant client).

import { Configurateur } from "@/components/Configurateur";
import { chargerDonnees } from "@/lib/donnees";

export default function Page() {
  const { catalogue, velos } = chargerDonnees();
  return <Configurateur catalogue={catalogue} velos={velos} />;
}
