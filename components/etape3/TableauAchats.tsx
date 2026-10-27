import { NOM_EMPLACEMENT } from "@/lib/libelles";
import { formaterEur, totalAchats, type LigneAchat } from "@/lib/prix";

export function TableauAchats({ achats }: { achats: LigneAchat[] }) {
  if (achats.length === 0) {
    return <p className="message info">Rien à acheter.</p>;
  }
  const total = totalAchats(achats);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th scope="col">À acheter</th>
            <th scope="col" className="prix">
              Prix indicatif
            </th>
          </tr>
        </thead>
        <tbody>
          {achats.map((a, i) => (
            <tr key={`${a.type}-${a.reference ?? a.libelle}-${i}`}>
              <td>
                <div>{a.type === "adaptateur" ? `Adaptateur : ${a.libelle}` : a.libelle}</div>
                <div className="piece-ref">
                  {a.emplacement ? NOM_EMPLACEMENT[a.emplacement] : "Adaptateur"}
                  {a.reference && ` · ${a.reference}`}
                </div>
              </td>
              <td className="prix">
                {a.prixEur !== undefined ? formaterEur(a.prixEur) : <span className="discret">non renseigné</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total{!total.complet && " (partiel)"}</td>
            <td className="prix">{formaterEur(total.totalEur)}</td>
          </tr>
        </tfoot>
      </table>
      {!total.complet && (
        <p className="discret" style={{ marginTop: 8 }}>
          {total.nbSansPrix} ligne{total.nbSansPrix > 1 ? "s" : ""} sans prix dans le catalogue : le total ne compte
          que les prix connus.
        </p>
      )}
    </>
  );
}
