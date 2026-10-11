import { useState } from "react";
import { Link } from "react-router-dom";

const menus = [
  {
    event: "Wedding reception",
    rev: "Rev 4 · not approved",
    items: [
      ["Hangar steak", "$18.40", "Prior plate"],
      ["Wagyu substitution", "$31.20", "Raises food cost"],
      ["Citrus salad", "$4.10", "Ingredient not ordered"],
    ],
    note: "Do not publish the BEO until the price change is accepted.",
  },
  {
    event: "Rivera Summer Social",
    rev: "Rev 2 · scope approved",
    items: [
      ["Grill buffet", "$22.00", "Count now 120"],
      ["Brioche sliders", "$3.40", "Sync failed"],
      ["Late dessert", "$6.00", "Staffing hours missing"],
    ],
    note: "Purchasing stays held until the deposit is confirmed.",
  },
  {
    event: "Corporate lunch",
    rev: "Published BEO",
    items: [
      ["Grain bowls", "$11.50", "Packed"],
      ["Allergen card", "—", "Unsigned"],
    ],
    note: "Packing is the open kitchen item. Payment is already succeeded.",
  },
];

export default function Menu() {
  const [picked, setPicked] = useState(menus[0].event);
  const [note, setNote] = useState("");
  const current = menus.find((menu) => menu.event === picked) ?? menus[0];

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">Menu and costing</p>
        <h1>Revisions stay drafts until someone approves them.</h1>
        <p>Compare plate cost before a BEO is published. Red is only used when a cost is blocking purchasing.</p>
      </header>
      <div className="page-grid">
        <section>
          {menus.map((menu) => (
            <button key={menu.event} className={`list-card ${picked === menu.event ? "selected" : ""}`} onClick={() => setPicked(menu.event)}>
              <strong>{menu.event}</strong>
              <span>{menu.rev}</span>
            </button>
          ))}
          <Link to="/">Back to command center</Link>
        </section>
        <section className="panel">
          <h2>{current.event}</h2>
          <p>{current.rev}</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Plate cost</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {current.items.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="callout">{current.note}</p>
          <button className="solid" onClick={() => setNote("Comparison saved as a draft. BEO was not published.")}>
            Save cost comparison
          </button>
          {note && <p className="notice">{note}</p>}
        </section>
      </div>
    </main>
  );
}
