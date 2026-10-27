// Lecture automatique du dossier /data : déposer un JSON dans data/velos ou data/pieces suffit.
// Utilise le système de fichiers Node : à n'appeler que côté serveur (page, build) ou dans les tests.

import fs from "node:fs";
import path from "node:path";
import type { ModeleVelo, Piece } from "@/lib/types";

export interface Donnees {
  catalogue: Piece[];
  velos: ModeleVelo[];
}

function lireJson(fichier: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(fichier, "utf8"));
  } catch (e) {
    throw new Error(`JSON illisible : ${fichier} (${(e as Error).message})`);
  }
}

function fichiersJson(dossier: string): string[] {
  if (!fs.existsSync(dossier)) return [];
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dossier, f));
}

export function chargerDonnees(racine: string = path.join(process.cwd(), "data")): Donnees {
  // data/pieces : chaque fichier est une liste de pièces
  const catalogue = fichiersJson(path.join(racine, "pieces")).flatMap((f) => {
    const contenu = lireJson(f);
    if (!Array.isArray(contenu)) throw new Error(`${f} doit contenir une liste de pièces`);
    return contenu as Piece[];
  });

  // data/velos : chaque fichier est un modèle de vélo
  const velos = fichiersJson(path.join(racine, "velos"))
    .map((f) => lireJson(f) as ModeleVelo)
    .sort((a, b) => a.marque.localeCompare(b.marque) || b.annee - a.annee || a.modele.localeCompare(b.modele));

  return { catalogue, velos };
}
