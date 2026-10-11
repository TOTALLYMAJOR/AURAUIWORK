import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { events, money, stageCounts, type EventRecord, type QueueView } from "../data";

const views: { id: QueueView; label: string }[] = [
  { id: "action", label: "Needs action" },
  { id: "upcoming", label: "Upcoming events" },
  { id: "sales", label: "Sales & follow-up" },
];

const roles = ["Owner", "Sales", "Kitchen", "Finance"] as const;

function Readiness({ event }: { event: EventRecord }) {
  const checks = event.workstreams.flatMap((stream) => stream.checks);
  const done = checks.filter((check) => check.done).length;
  return (
    <span className="meter" title={`${done} of ${checks.length} checks complete`}>
      {checks.map((check, index) => (
        <i key={`${check.label}-${index}`} className={check.done ? "done" : ""} />
      ))}
    </span>
  );
}

function tone(status: string) {
  if (status === "ready" || status === "done") return "teal";
  if (status === "blocked" || status === "critical") return "red";
  if (status === "watch" || status === "soon") return "amber";
  return "muted";
}

export default function Home() {
  const [view, setView] = useState<QueueView>("action");
  const [role, setRole] = useState<(typeof roles)[number]>("Owner");
  const [selectedId, setSelectedId] = useState("rivera");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("Next 14 days");
  const [notice, setNotice] = useState("");
  const [showCalc, setShowCalc] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState("");

  const selected = events.find((event) => event.id === selectedId) ?? events[0];

  const rows = useMemo(() => {
    return events.filter((event) => {
      if (!event.queue.includes(view)) return false;
      const blob = `${event.name} ${event.client} ${event.owner} ${event.nextAction}`.toLowerCase();
      return blob.includes(query.toLowerCase());
    });
  }, [view, query]);

  const booked = events.filter((event) => event.bookedValue > 0);
  const metrics = [
    {
      id: "booked",
      label: "Booked event value",
      value: money(booked.reduce((sum, event) => sum + event.bookedValue, 0)),
      note: "Confirmed bookings in window",
      calc: "Sum of confirmed event value. Quotes are excluded. Not a cash figure.",
      window: range,
      kind: "Actual bookings",
      missing: "None",
      updated: "12 min ago",
      events: booked.map((event) => event.name),
    },
    {
      id: "deposits",
      label: "Deposits overdue",
      value: money(events.reduce((sum, event) => sum + event.depositOverdue, 0)),
      note: "Past contractual due date",
      calc: "Required deposits whose due date has passed and whose customer payment is not succeeded.",
      window: range,
      kind: "Actual",
      missing: "None",
      updated: "2 min ago",
      events: events.filter((event) => event.depositOverdue > 0).map((event) => event.name),
    },
    {
      id: "contribution",
      label: "Projected contribution",
      value: money(events.reduce((sum, event) => sum + event.projectedContribution, 0)),
      note: "Revenue less included direct costs",
      calc: "Event revenue minus recipe, staffing, and known rental costs. Missing costs are listed per event and are not estimated.",
      window: range,
      kind: "Projected",
      missing: "Rentals and overtime on 3 events",
      updated: "18 min ago",
      events: events.map((event) => event.name),
    },
    {
      id: "action",
      label: "Events needing action",
      value: String(events.filter((event) => event.queue.includes("action")).length),
      note: "Distinct events with a next action",
      calc: "Count of events in Needs action. Not a dollar total and not added to the figures above.",
      window: range,
      kind: "Operational",
      missing: "None",
      updated: "Just now",
      events: events.filter((event) => event.queue.includes("action")).map((event) => event.name),
    },
  ];

  function act(message: string) {
    setNotice(message);
  }

  return (
    <div className={`workspace ${selected ? "with-drawer" : ""}`}>
      <header className="topbar">
        <div>
          <p className="kicker">Command center</p>
          <h1>Choose the next event. Resolve it in the panel.</h1>
        </div>
        <div className="top-controls">
          <label>
            Date range
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option>Next 14 days</option>
              <option>This week</option>
              <option>This month</option>
            </select>
          </label>
          <label>
            Location
            <select defaultValue="Harbor kitchen">
              <option>Harbor kitchen</option>
              <option>All kitchens</option>
            </select>
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(e) => {
                const next = e.target.value as (typeof roles)[number];
                setRole(next);
                setView(next === "Sales" ? "sales" : next === "Kitchen" ? "upcoming" : "action");
              }}
            >
              {roles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="search">
            Search
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Event, owner, action" />
          </label>
        </div>
      </header>

      <p className="data-status">
        Data status · Payments updated 2 minutes ago. Inventory sync failed 18 minutes ago. Role view: {role}. These
        categories are not added together.
      </p>

      <section className="snapshot" aria-label="Business snapshot">
        {metrics.map((metric) => (
          <button key={metric.id} className="metric" onClick={() => setShowCalc(showCalc === metric.id ? null : metric.id)}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.note}</em>
            {showCalc === metric.id && (
              <div className="calc">
                <p>{metric.calc}</p>
                <p>Window: {metric.window} · {metric.kind}</p>
                <p>Missing inputs: {metric.missing} · Updated {metric.updated}</p>
                <p>Included: {metric.events.join(", ") || "None"}</p>
              </div>
            )}
          </button>
        ))}
      </section>

      <section className="company-strip" aria-label="Company stage counts">
        <div>
          <p className="kicker">Company-wide · not this event</p>
          <h2>Events by stage</h2>
        </div>
        <ol>
          {stageCounts.map((stage) => (
            <li key={stage.label}>
              <strong>{stage.count}</strong>
              <span>{stage.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="queue" aria-label="Priority queue">
        <div className="queue-head">
          <div className="tabs">
            {views.map((item) => (
              <button key={item.id} className={view === item.id ? "on" : ""} onClick={() => setView(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <p>{rows.length} shown · select a row to open the event workspace</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Service deadline</th>
                <th>Guests</th>
                <th>Financial position</th>
                <th>Readiness</th>
                <th>Owner</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className={event.id === selected.id ? "selected" : ""} onClick={() => setSelectedId(event.id)}>
                  <td>
                    <strong>{event.name}</strong>
                    <span>{event.client} · {event.type}</span>
                  </td>
                  <td>
                    {event.serviceDeadline}
                    <span className={`pill ${tone(event.urgency)}`}>{event.deadlineNote}</span>
                  </td>
                  <td className="num">{event.guests}</td>
                  <td>{event.financialPosition}</td>
                  <td>
                    <Readiness event={event} />
                    <span>{event.readinessSummary}</span>
                  </td>
                  <td>{event.owner}</td>
                  <td>
                    <button className="text-action" onClick={() => setSelectedId(event.id)}>
                      {event.nextAction}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>No events in this view match the search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lower">
        <article>
          <p className="kicker">Sales</p>
          <h3>Quotes awaiting follow-up</h3>
          <ul>
            <li>Harbor tasting · quiet 3 days · Fri hold</li>
            <li>Board dinner · expires Friday · 34% margin</li>
          </ul>
          <Link to="/reservations">Open bookings</Link>
        </article>
        <article>
          <p className="kicker">Margin exceptions</p>
          <h3>Below the 32% target</h3>
          <ul>
            {events
              .filter((event) => event.bookedValue > 0 && event.margin < event.targetMargin)
              .map((event) => (
                <li key={event.id}>
                  {event.name} · {event.margin}% · missing {event.missingCosts[0] || "none"}
                </li>
              ))}
          </ul>
        </article>
        <article>
          <p className="kicker">Capacity</p>
          <h3>Upcoming constraints</h3>
          <ul>
            <li>Today 10:15 AM · one van, packing still open</li>
            <li>Tomorrow PM · captains free, purchasing late</li>
            <li>Friday · studio tasting holds the prep line</li>
          </ul>
          <Link to="/menu">Review menus</Link>
        </article>
      </section>

      <EventDrawer
        event={selected}
        notice={notice}
        showEvidence={showEvidence}
        ownerDraft={ownerDraft}
        onToggleEvidence={() => setShowEvidence((open) => !open)}
        onOwnerDraft={setOwnerDraft}
        onAct={act}
        onClose={() => {
          const index = events.findIndex((item) => item.id === selected.id);
          setSelectedId(events[(index + 1) % events.length].id);
        }}
      />
    </div>
  );
}

function EventDrawer({
  event,
  notice,
  showEvidence,
  ownerDraft,
  onToggleEvidence,
  onOwnerDraft,
  onAct,
  onClose,
}: {
  event: EventRecord;
  notice: string;
  showEvidence: boolean;
  ownerDraft: string;
  onToggleEvidence: () => void;
  onOwnerDraft: (value: string) => void;
  onAct: (message: string) => void;
  onClose: () => void;
}) {
  return (
    <aside className="drawer" aria-label="Event detail">
      <div className="drawer-top">
        <div>
          <p className="kicker">{event.name} · Event progress</p>
          <h2>{event.name}</h2>
          <p className="sub">
            {event.serviceWhen} · {event.guests} guests · {event.location}
          </p>
        </div>
        <button className="ghost" onClick={onClose}>
          Next event
        </button>
      </div>

      <ol className="spine">
        {event.spine.map((step) => (
          <li key={step.label} className={`${step.state}${event.urgency === "critical" && step.state === "blocked" ? " hot" : ""}`}>
            <i />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>

      <div className="issue">
        <p className="kicker">{event.blocker?.cannotProceed ? "Cannot proceed until" : "Watch"}</p>
        <h3>{event.blocker ? event.blocker.title : "No blocker. Follow up while the quote is still open."}</h3>
        {event.blocker && (
          <>
            <p>
              <strong>Resolve by </strong>
              {event.blocker.resolveBy}
            </p>
            <p>{event.blocker.ifMissed}</p>
            <ul>
              {event.blocker.affects.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="primary-action">
        <button className="solid" onClick={() => onAct(`${event.nextAction} opened for ${event.name}. Nothing was marked complete.`)}>
          {event.nextAction}
        </button>
        <div className="alt-actions">
          <button onClick={() => onAct(`Deposit request drafted for ${event.client}. Not sent.`)}>Request deposit</button>
          <button onClick={() => onAct(`Menu revision opened for ${event.name}. BEO not published.`)}>Review menu</button>
          <button onClick={() => onAct(ownerDraft ? `${ownerDraft} assigned to ${event.name}.` : "Enter an owner name first.")}>
            Assign owner
          </button>
          <button onClick={() => onAct("Payment exception opened. Status was not changed to paid.")}>Inspect payment</button>
        </div>
        <label>
          Owner
          <input value={ownerDraft} onChange={(e) => onOwnerDraft(e.target.value)} placeholder="Name to assign" />
        </label>
        {notice && <p className="notice">{notice}</p>}
      </div>

      <section className="pay-model">
        <h3>Payment states</h3>
        <dl>
          <div>
            <dt>Customer payment</dt>
            <dd>{event.payment.customer}</dd>
          </div>
          <div>
            <dt>Funds availability</dt>
            <dd>{event.payment.funds}</dd>
          </div>
          <div>
            <dt>Bank payout</dt>
            <dd>{event.payment.payout}</dd>
          </div>
          <div>
            <dt>Accounting match</dt>
            <dd>{event.payment.recon}</dd>
          </div>
        </dl>
        <p>{event.payment.policy}</p>
        <p className="mono">{event.payment.updated} · {event.payment.method} · {event.payment.required}</p>
      </section>

      <section>
        <h3>Readiness by workstream</h3>
        {event.workstreams.map((stream) => (
          <div key={stream.name} className={`stream ${stream.status}`}>
            <header>
              <strong>{stream.name}</strong>
              <span className={`pill ${tone(stream.status)}`}>{stream.status === "blocked" ? "Blocked" : stream.status}</span>
            </header>
            <p>{stream.summary}</p>
            <ul>
              {stream.checks.map((check) => (
                <li key={check.label} className={check.done ? "done" : ""}>
                  {check.done ? "Done" : "Missing"} · {check.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {event.marginAlert && (
        <section className="margin-alert">
          <h3>Margin change</h3>
          <p>{event.marginAlert}</p>
          <div className="compare">
            <div>
              <span>Before</span>
              <strong>{money(event.marginBefore.revenue)}</strong>
              <em>Cost {money(event.marginBefore.cost)} · {event.marginBefore.margin}%</em>
            </div>
            <div>
              <span>After</span>
              <strong>{money(event.marginAfter.revenue)}</strong>
              <em>Cost {money(event.marginAfter.cost)} · {event.marginAfter.margin}%</em>
            </div>
          </div>
          <p>Missing costs: {event.missingCosts.length ? event.missingCosts.join(", ") : "None listed"}.</p>
          <p>Target {event.targetMargin}% · projected {event.margin}% · contribution {money(event.projectedContribution)}</p>
        </section>
      )}

      <section className="ai">
        <p className="kicker">Proposed action · needs approval</p>
        <h3>{event.ai.action}</h3>
        <p><strong>Why now. </strong>{event.ai.why}</p>
        <p><strong>Records. </strong>{event.ai.records.join(" · ")}</p>
        <p><strong>Unknown. </strong>{event.ai.unknown}</p>
        <p><strong>If approved. </strong>{event.ai.ifApproved}</p>
        <p><strong>Will not. </strong>{event.ai.willNot}</p>
        <p>{event.ai.sendsMessage ? "This would message the client." : "This does not message the client or change a record until you confirm."}</p>
      </section>

      <button className="ghost wide" onClick={onToggleEvidence}>
        {showEvidence ? "Hide evidence and history" : "Evidence and history"}
      </button>
      {showEvidence && (
        <ul className="evidence">
          {event.evidence.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              <em>{item.time}</em>
            </li>
          ))}
          {event.unknowns.map((item) => (
            <li key={item}>
              <strong>Unknown</strong>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
