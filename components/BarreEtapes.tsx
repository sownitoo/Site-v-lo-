export type Etape = 1 | 2 | 3;

const ETAPES: { num: Etape; libelle: string }[] = [
  { num: 1, libelle: "Mon vélo" },
  { num: 2, libelle: "Mes pièces" },
  { num: 3, libelle: "Mon upgrade" },
];

export function BarreEtapes({
  etape,
  accessibles,
  onChanger,
}: {
  etape: Etape;
  accessibles: Record<Etape, boolean>;
  onChanger: (e: Etape) => void;
}) {
  return (
    <nav aria-label="Étapes">
      <ol className="etapes">
        {ETAPES.map(({ num, libelle }) => (
          <li key={num}>
            <button
              type="button"
              aria-current={etape === num ? "step" : undefined}
              disabled={!accessibles[num]}
              onClick={() => onChanger(num)}
              aria-label={`Étape ${num} : ${libelle}`}
            >
              <span className="num">{num}</span>
              <span className="libelle">{libelle}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
