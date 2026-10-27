import { ICONE_STATUT, LIBELLE_STATUT } from "@/lib/libelles";
import type { Statut } from "@/lib/types";

export function BadgeStatut({ statut }: { statut: Statut }) {
  return (
    <span className={`badge ${statut}`}>
      <span aria-hidden="true">{ICONE_STATUT[statut]}</span>
      {LIBELLE_STATUT[statut]}
    </span>
  );
}
