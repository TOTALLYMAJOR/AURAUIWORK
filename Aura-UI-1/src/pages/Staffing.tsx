import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { gap, inventory, roster, shifts } from "../staffing/data";
import "../staffing/styles.css";

function Frame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="staffing-module">
    <header className="staffing-header"><p className="kicker">People & equipment · sample workspace</p><h1>{title}</h1><p>{description}</p></header>
    <p className="staffing-boundary">Sample data, not linked to bookings. Relative times are illustrative. Drafts stay on this page only; nothing is sent, assigned, reserved, or released.</p>
    {children}
  </main>;
}

export default function Staffing() {
  const [filter, setFilter] = useState("All shifts");
  const [selected, setSelected] = useState(shifts[0].id);
  const rows = shifts.filter((shift) => filter === "All shifts" || (filter === "Coverage gaps" ? gap(shift) > 0 : gap(shift) === 0));
  const active = rows.find((shift) => shift.id === selected) ?? rows[0];
  const shortages = inventory.filter((item) => item.onHand < item.par);
  return <Frame title="Staffing floor" description="See the coverage gap. Review the person before drafting an offer.">
    <div className="staffing-tools" role="group" aria-label="Shift view">{["All shifts", "Coverage gaps", "Full coverage"].map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setSelected(""); }}>{value}</button>)}</div>
    <p role="status">{rows.length} shifts shown · {rows.reduce((sum, shift) => sum + gap(shift), 0)} unfilled roles in this view</p>
    <div className="staffing-shifts">{rows.map((shift) => <button key={shift.id} type="button" className="staffing-card" aria-pressed={active?.id === shift.id} onClick={() => setSelected(shift.id)} aria-label={`Review ${shift.site} ${shift.role}`}>
      <span className={gap(shift) ? "staffing-attention" : "staffing-muted"}>{gap(shift) ? `${gap(shift)} unfilled` : "Coverage full · acceptance unverified"}</span>
      <strong>{shift.site}</strong><span>{shift.role}</span><span className="staffing-muted">{shift.window}</span>
      <span className="staffing-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, shift.filled / shift.needed * 100)}%` }} /></span>
      <span>{shift.filled} / {shift.needed} roles filled · {shift.pay}</span>
    </button>)}</div>
    <div className="staffing-split">
      <section className="staffing-detail" aria-label="Selected shift">{active ? <>
        <p className="kicker">Selected shift</p><h2>{active.site} · {active.role}</h2>
        <dl><div><dt>Service window</dt><dd>{active.window}</dd></div><div><dt>Recorded lead</dt><dd>{active.lead}</dd></div><div><dt>Coverage</dt><dd>{active.filled} of {active.needed} roles filled</dd></div><div><dt>Source label</dt><dd>{active.status} (sample)</dd></div></dl>
        {gap(active) > 0 && ["filled", "confirmed"].includes(active.status) && <p className="staffing-attention">Source mismatch: this shift is labeled {active.status}, but {gap(active)} roles are still unfilled.</p>}
        <p>Coverage is not acceptance. Availability, qualifications, and release requirements still need verification.</p>
        <Link className="staffing-action" to={`/roster?shift=${active.id}`}>Review crew for this shift</Link>
      </> : <p>No shifts in this view.</p>}</section>
      <section className="staffing-detail"><p className="kicker">All sample inventory · not event-specific</p><h2>{shortages.length} items below par</h2><p>Par is a stock target, not an event requirement or a release rule.</p>
        <ul className="staffing-stock-list">{shortages.map((item) => <li key={item.sku}><span>{item.name}</span><span className="staffing-attention">{item.par - item.onHand} {item.unit} below par</span></li>)}</ul>
        <Link className="staffing-action" to="/inventory">Review stock desk</Link>
      </section>
    </div>
  </Frame>;
}

export function Roster() {
  const [params, setParams] = useSearchParams();
  const shiftId = params.get("shift") ?? "";
  const shift = shifts.find((item) => item.id === shiftId);
  const [filter, setFilter] = useState("All crew");
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<{ personId: string; shiftId: string } | null>(null);
  const rows = roster.filter((person) => filter === "All crew" || person.status === filter);
  const person = rows.find((item) => item.id === selected);
  const currentDraft = draft && draft.shiftId === shiftId && draft.personId === person?.id;
  return <Frame title="Crew roster" description="Review availability and qualifications before preparing an offer.">
    <div className="staffing-tools">
      <label>Target shift<select value={shift?.id ?? ""} onChange={(event) => { setParams(event.target.value ? { shift: event.target.value } : {}); setDraft(null); }}><option value="">Choose a shift</option>{shifts.map((item) => <option key={item.id} value={item.id}>{item.site} · {item.role} · {item.window}</option>)}</select></label>
      <label>Crew status<select value={filter} onChange={(event) => { setFilter(event.target.value); setSelected(""); setDraft(null); }}>{["All crew", "available", "on-shift", "hold", "off"].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    {shiftId && !shift && <p role="alert">The requested shift was not found. Choose a listed shift; no target has been assumed.</p>}
    <p role="status">{rows.length} crew shown · availability is sample data, not a verified match for the target shift</p>
    <div className="staffing-roster">{rows.map((item) => <button key={item.id} type="button" className="staffing-card" aria-pressed={person?.id === item.id} aria-label={`Review ${item.name}`} onClick={() => { setSelected(item.id); setDraft(null); }}>
      <span className="staffing-muted">{item.status}</span><strong>{item.name}</strong><span>{item.role} · {item.availability}</span><span className="staffing-certs">{item.certs.join(" · ")}</span>
    </button>)}</div>
    <section className="staffing-detail staffing-offer" aria-label="Offer draft"><h2>{person ? `Review offer for ${person.name}` : "Select a crew member"}</h2>
      <p>{shift ? `${shift.site} · ${shift.role} · ${shift.window} · ${shift.pay}` : "Choose a target shift before drafting an offer."}</p>
      <p id="offer-rule">{person?.status === "off" ? "This person is marked off. An offer cannot be drafted in this sample workspace." : "Check schedule conflicts, role qualifications, and any existing hold. A draft is not an assignment or acceptance."}</p>
      {shift && gap(shift) === 0 && <p className="staffing-attention">Recorded coverage is full. Any replacement or extra position needs review.</p>}
      <button type="button" className="staffing-action" disabled={!person || !shift || person.status === "off"} aria-describedby="offer-rule" onClick={() => { if (person && shift && person.status !== "off") setDraft({ personId: person.id, shiftId: shift.id }); }}>Prepare offer draft</button>
      {currentDraft && person && shift && <div className="staffing-draft" role="status"><h3>Local offer draft</h3><p>{person.name} → {shift.site} · {shift.role} · {shift.window} · {shift.pay}</p><p>Not sent or saved. No acceptance recorded; shift coverage is unchanged.</p><button type="button" onClick={() => setDraft(null)}>Discard offer draft</button></div>}
      <Link to="/staffing">Back to staffing floor</Link>
    </section>
  </Frame>;
}

export function Inventory() {
  const [category, setCategory] = useState("All categories");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(inventory[0].sku);
  const [pull, setPull] = useState<string[]>([]);
  const rows = inventory.filter((item) => (category === "All categories" || item.category === category) && `${item.name} ${item.sku} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase()));
  const active = rows.find((item) => item.sku === selected) ?? rows[0];
  function toggle(sku: string) { setPull((items) => items.includes(sku) ? items.filter((item) => item !== sku) : [...items, sku]); }
  return <Frame title="Stock desk" description="Inspect stock against par. Prepare a review list without changing inventory.">
    <div className="staffing-tools"><label>Search inventory<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(""); }} placeholder="Item, SKU, or location" /></label><label>Category<select value={category} onChange={(event) => { setCategory(event.target.value); setSelected(""); }}>{["All categories", ...new Set(inventory.map((item) => item.category))].map((value) => <option key={value}>{value}</option>)}</select></label></div>
    <p role="status">{rows.length} items shown · {rows.filter((item) => item.onHand < item.par).length} below par in this view</p>
    <div className="staffing-inventory-layout"><div className="staffing-table" role="region" aria-label="Inventory table" tabIndex={0}><table><thead><tr><th scope="col">Item / location</th><th scope="col">On hand / par</th><th scope="col">Stock status</th></tr></thead><tbody>{rows.map((item) => <tr key={item.sku} className={active?.sku === item.sku ? "staffing-selected-row" : ""}><td><button className="event-link" type="button" aria-pressed={active?.sku === item.sku} onClick={() => setSelected(item.sku)} aria-label={`Inspect ${item.name}`}>{item.name}</button><span>{item.sku} · {item.location}</span></td><td>{item.onHand} / {item.par} {item.unit}</td><td><span className={item.onHand < item.par ? "staffing-attention" : "staffing-muted"}>{item.status}</span></td></tr>)}</tbody></table>{!rows.length && <p className="staffing-empty">No inventory matches. Clear the search or change category.</p>}</div>
      <section className="staffing-detail" aria-label="Selected stock item">{active ? <><p className="kicker">{active.sku} · {active.category}</p><h2>{active.name}</h2><dl><div><dt>On hand</dt><dd>{active.onHand} {active.unit}</dd></div><div><dt>Par target</dt><dd>{active.par} {active.unit}</dd></div><div><dt>Location</dt><dd>{active.location}</dd></div><div><dt>Below par</dt><dd>{Math.max(0, active.par - active.onHand)} {active.unit}</dd></div></dl><p>Par is a general stock target. Event quantities and existing reservations are unknown.</p><button className="staffing-action" type="button" onClick={() => toggle(active.sku)}>{pull.includes(active.sku) ? "Remove from pull-list draft" : "Add to pull-list draft"}</button></> : <p>No stock item selected.</p>}</section>
    </div>
    <section className="staffing-detail staffing-pull" aria-label="Pull-list draft"><h2>Pull-list draft · {pull.length} items</h2><p>Across all categories, including hidden search results. Item review only: no quantities allocated, stock reserved, or release authorized. Leaving this page clears the draft.</p>
      {pull.length ? <><ul>{inventory.filter((item) => pull.includes(item.sku)).map((item) => <li key={item.sku}><span>{item.name} · {item.sku}</span><button type="button" aria-label={`Remove ${item.name} from draft`} onClick={() => toggle(item.sku)}>Remove</button></li>)}</ul><button type="button" onClick={() => setPull([])}>Clear pull-list draft</button></> : <p>No items added.</p>}
    </section>
  </Frame>;
}
