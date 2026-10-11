import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { events } from "../data";

const types = ["Drop-off", "Staffed buffet", "Plated service", "Tasting"];

export default function Reservations() {
  const [draft, setDraft] = useState<{ name: string; date: string; guests: number; type: string; notes: string } | null>(null);
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const date = String(data.get("date") ?? "");
    const guests = Number(data.get("guests"));
    if (!name || !date || !Number.isInteger(guests) || guests < 1) return;
    setDraft({ name, date, guests, type, notes: notes.trim() });
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">Bookings</p>
        <h1>Name, date, and guests. Details only if you have them.</h1>
        <p>Sample workspace. Prepare an inquiry draft on this page; it is not saved to bookings or sent to production. Payment confirmation stays a separate step.</p>
      </header>
      <div className="page-grid">
        <section className="panel">
          <h2>New inquiry</h2>
          <form onSubmit={submit} onChange={() => setDraft(null)} className="booking-form">
            <label>
              Event name
              <input name="name" required pattern=".*\S.*" title="Enter an event name containing at least one non-space character" placeholder="Client or event" />
            </label>
            <label>
              Service date
              <input name="date" type="date" required />
            </label>
            <label>
              Guests
              <input name="guests" type="number" min={1} step={1} required />
            </label>
            <button type="button" className="ghost" aria-expanded={details} aria-controls="service-details" onClick={() => setDetails((open) => !open)}>
              {details ? "Hide service details" : "Add service details"}
            </button>
              <div id="service-details" hidden={!details}>
                <fieldset>
                  <legend>Service type</legend>
                  {types.map((item) => (
                    <label key={item} className="choice">
                      <input type="radio" name="type" value={item} checked={type === item} onChange={() => setType(item)} />
                      {item}
                    </label>
                  ))}
                </fieldset>
                <button type="button" className="ghost" disabled={!type} onClick={() => { setType(""); setDraft(null); }}>Clear service type</button>
                <label>
                  Notes
                  <textarea name="notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Venue, dietary needs, deposit terms" />
                </label>
              </div>
            <button className="solid" type="submit">
              Prepare inquiry draft
            </button>
            {draft && (
              <p className="notice" role="status">
                {draft.name} prepared for review on this page only. Not saved to bookings. No deposit was marked received.
                {` Service date: ${draft.date}. Guests: ${draft.guests}. Service type: ${draft.type || "Not specified"}. Notes: ${draft.notes || "None provided"}.`}
              </p>
            )}
          </form>
        </section>
        <section>
          <h2>On the books</h2>
          <p className="queue-hint">Open one booking to see payment position. The list stays a scan.</p>
          <ul className="booking-list">
            {events.map((event) => {
              const open = openId === event.id;
              return (
                <li key={event.id}>
                  <button type="button" className="lower-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : event.id)}>
                    <span>
                      <strong>{event.name}</strong>
                      <em>
                        {event.serviceWhen} · {event.guests} guests
                      </em>
                    </span>
                    <i>{open ? "Hide" : "Show"}</i>
                  </button>
                  {open && (
                    <div className="booking-detail">
                      <p>{event.financialPosition}</p>
                      <p>
                        Owner {event.owner} · {event.location}
                      </p>
                      <p>{event.nextAction}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link to="/">Return to the queue</Link>
        </section>
      </div>
    </main>
  );
}
