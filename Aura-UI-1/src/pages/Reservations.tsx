import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { events } from "../data";

const types = ["Drop-off", "Staffed buffet", "Plated service", "Tasting"];

export default function Reservations() {
  const [sent, setSent] = useState("");
  const [type, setType] = useState(types[0]);
  const [details, setDetails] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSent(`${data.get("name")} saved as an inquiry. No deposit was marked received.`);
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">Bookings</p>
        <h1>Name, date, and guests. Details only if you have them.</h1>
        <p>A new inquiry does not enter production. Payment confirmation stays a separate step.</p>
      </header>
      <div className="page-grid">
        <section className="panel">
          <h2>New inquiry</h2>
          <form onSubmit={submit} className="booking-form">
            <label>
              Event name
              <input name="name" required placeholder="Client or event" />
            </label>
            <label>
              Service date
              <input name="date" type="date" required />
            </label>
            <label>
              Guests
              <input name="guests" type="number" min={1} defaultValue={40} required />
            </label>
            <button type="button" className="ghost" onClick={() => setDetails((open) => !open)}>
              {details ? "Hide service details" : "Add service details"}
            </button>
            {details && (
              <>
                <fieldset>
                  <legend>Service type</legend>
                  {types.map((item) => (
                    <label key={item} className="choice">
                      <input type="radio" name="type" checked={type === item} onChange={() => setType(item)} />
                      {item}
                    </label>
                  ))}
                </fieldset>
                <label>
                  Notes
                  <textarea name="notes" rows={4} placeholder="Venue, dietary needs, deposit terms" />
                </label>
              </>
            )}
            <button className="solid" type="submit">
              Save inquiry
            </button>
            {sent && (
              <p className="notice">
                {sent} Type: {type}.
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
