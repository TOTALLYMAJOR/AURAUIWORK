import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Disclosure from "../components/Disclosure";
import { events, money, stageCounts, type EventRecord, type QueueView } from "../data";

const views: { id: QueueView; label: string }[] = [
  { id: "action", label: "Needs action" },
  { id: "upcoming", label: "Upcoming" },
  { id: "sales", label: "Sales" },
];

const roles = ["Owner", "Sales", "Kitchen", "Finance"] as const;
type Role = (typeof roles)[number];

const roleCopy: Record<Role, { view: QueueView; note: string }> = {
  Owner: { view: "action", note: "Owner lens: one cutoff at a time. Details stay closed until you open an event." },
  Sales: { view: "sales", note: "Sales lens: quotes and follow-ups only. Production holds are hidden." },
  Kitchen: { view: "upcoming", note: "Kitchen lens: upcoming service. Packing and unpublished BEOs come first." },
  Finance: { view: "action", note: "Finance lens: deposit exceptions are marked. Other checks stay collapsed." },
};

function tone(status: string) {
  if (status === "ready" || status === "done") return "teal";
  if (status === "blocked" || status === "critical") return "red";
  if (status === "watch" || status === "soon") return "amber";
  return "muted";
}

function focusFor(role: Role) {
  if (role === "Sales") return events.find((event) => event.queue.includes("sales")) ?? events[0];
  if (role === "Kitchen") return events.find((event) => event.id === "corp-lunch") ?? events[0];
  if (role === "Finance") return events.find((event) => event.depositOverdue > 0) ?? events[0];
  return events.find((event) => event.urgency === "critical" && event.blocker?.cannotProceed) ?? events[0];
}

function initialSection(event: EventRecord, role: Role) {
  const action = event.nextAction.toLowerCase();
  if (action.includes("payment") || role === "Finance") return "pay";
  if (action.includes("pack") || action.includes("menu") || role === "Kitchen") return "work";
  if (event.marginAlert) return "margin";
  return "suggest";
}

export default function Home() {
  const [view, setView] = useState<QueueView>("action");
  const [role, setRole] = useState<Role>("Owner");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("Next 14 days");
  const [location, setLocation] = useState("Harbor kitchen");
  const [openMetric, setOpenMetric] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showWindow, setShowWindow] = useState(false);
  const [openLower, setOpenLower] = useState<string | null>(null);
  const [roleNote, setRoleNote] = useState(roleCopy.Owner.note);

  const selected = events.find((event) => event.id === selectedId) ?? null;
  const focus = focusFor(role);

  const rows = useMemo(() => {
    return events.filter((event) => {
      if (!event.queue.includes(view)) return false;
      const blob = `${event.name} ${event.client} ${event.owner} ${event.nextAction}`.toLowerCase();
      return blob.includes(query.toLowerCase());
    });
  }, [view, query]);

  const counts = useMemo(() => {
    return views.map((item) => ({
      ...item,
      count: events.filter((event) => {
        if (!event.queue.includes(item.id)) return false;
        const blob = `${event.name} ${event.client} ${event.owner} ${event.nextAction}`.toLowerCase();
        return blob.includes(query.toLowerCase());
      }).length,
    }));
  }, [query]);

  const booked = events.filter((event) => event.bookedValue > 0);
  const metrics = [
    {
      id: "booked",
      label: "Booked event value",
      value: money(booked.reduce((sum, event) => sum + event.bookedValue, 0)),
      note: "Confirmed only",
      calc: "Sum of confirmed event value. Quotes are excluded. Not a cash figure.",
      kind: "Actual bookings",
      missing: "None",
      updated: "12 min ago",
      events: booked.map((event) => event.name),
    },
    {
      id: "deposits",
      label: "Deposits overdue",
      value: money(events.reduce((sum, event) => sum + event.depositOverdue, 0)),
      note: "Past due date",
      calc: "Required deposits whose due date has passed and whose customer payment is not succeeded.",
      kind: "Actual",
      missing: "None",
      updated: "2 min ago",
      events: events.filter((event) => event.depositOverdue > 0).map((event) => event.name),
    },
    {
      id: "contribution",
      label: "Projected contribution",
      value: money(events.reduce((sum, event) => sum + event.projectedContribution, 0)),
      note: "Not cash",
      calc: "Event revenue minus recipe, staffing, and known rental costs. Missing costs are listed, not estimated.",
      kind: "Projected",
      missing: "Rentals and overtime on 3 events",
      updated: "18 min ago",
      events: events.map((event) => event.name),
    },
    {
      id: "action",
      label: "Needs action",
      value: String(events.filter((event) => event.queue.includes("action")).length),
      note: "Distinct events",
      calc: "Count of events in Needs action. Not a dollar total and not added to the figures above.",
      kind: "Operational",
      missing: "None",
      updated: "Just now",
      events: events.filter((event) => event.queue.includes("action")).map((event) => event.name),
    },
  ];

  const quotes = events.filter((event) => event.queue.includes("sales"));
  const thin = events.filter((event) => event.bookedValue > 0 && event.margin < event.targetMargin);

  function chooseRole(next: Role) {
    setRole(next);
    setView(roleCopy[next].view);
    setRoleNote(roleCopy[next].note);
    setSelectedId(null);
    setOpenMetric(null);
  }

  function openEvent(id: string) {
    setSelectedId(id);
    setOpenLower(null);
  }

  return (
    <div className={`workspace ${selected ? "with-drawer" : ""}`}>
      <header className="topbar">
        <div>
          <p className="kicker">Command center · {role}</p>
          <h1>One decision first. The rest stays closed.</h1>
        </div>
        <div className="top-controls">
          <label>
            Role
            <select value={role} onChange={(e) => chooseRole(e.target.value as Role)}>
              {roles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="search">
            Search
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Event, owner, action" />
          </label>
          <button type="button" className={`window-chip ${showWindow ? "on" : ""}`} onClick={() => setShowWindow((open) => !open)}>
            {range} · {location}
          </button>
        </div>
      </header>

      {showWindow && (
        <div className="window-panel">
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
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option>Harbor kitchen</option>
              <option>All kitchens</option>
            </select>
          </label>
          <p>Figures below use this window. They are not added together.</p>
        </div>
      )}

      <p className="role-note" role="status">
        {roleNote}
        {query ? ` Showing matches for “${query}”.` : ""}
      </p>

      <section className={`focus-card ${focus.urgency}`} aria-label="Next decision">
        <div>
          <p className="kicker">{focus.blocker?.cannotProceed ? "Cannot proceed" : "Next decision"} · {focus.blocker?.resolveBy ?? focus.deadlineNote}</p>
          <h2>{focus.name}</h2>
          <p>{focus.blocker ? focus.blocker.title : focus.nextAction}</p>
        </div>
        <button type="button" className="solid" onClick={() => openEvent(focus.id)}>
          {selectedId === focus.id ? "Open in panel" : "Resolve this"}
        </button>
      </section>

      <button type="button" className="health-chip" aria-expanded={showHealth} onClick={() => setShowHealth((open) => !open)}>
        <span className="dot live" /> Payments live
        <span className="dot failed" /> Inventory sync failed
        <em>{showHealth ? "Hide status" : "Data status"}</em>
      </button>
      {showHealth && (
        <p className="data-status">
          Payments updated 2 minutes ago. Inventory sync failed 18 minutes ago. Role view: {role}. Booked value, overdue
          deposits, and projected contribution are separate. They are not added together.
        </p>
      )}

      <section className="snapshot" aria-label="Business snapshot">
        {metrics.map((metric) => {
          const open = openMetric === metric.id;
          return (
            <button
              key={metric.id}
              type="button"
              className={`metric ${open ? "open" : ""}`}
              aria-expanded={open}
              onClick={() => setOpenMetric(open ? null : metric.id)}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <em>{open ? "Hide calculation" : metric.note}</em>
              {open && (
                <div className="calc">
                  <p>{metric.calc}</p>
                  <p>
                    Window: {range} · {location} · {metric.kind}
                  </p>
                  <p>
                    Missing inputs: {metric.missing} · Updated {metric.updated}
                  </p>
                  <p>Included: {metric.events.join(", ") || "None"}</p>
                </div>
              )}
            </button>
          );
        })}
      </section>

      <Disclosure
        label="Events by stage"
        hint={`${stageCounts.reduce((sum, stage) => sum + stage.count, 0)} company-wide · not this queue`}
        open={showStages}
        onToggle={() => setShowStages((open) => !open)}
      >
        <ol className="stage-list">
          {stageCounts.map((stage) => (
            <li key={stage.label}>
              <strong>{stage.count}</strong>
              <span>{stage.label}</span>
            </li>
          ))}
        </ol>
      </Disclosure>

      <section className="queue" aria-label="Priority queue">
        <div className="queue-head">
          <div className="tabs" role="tablist">
            {counts.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                className={view === item.id ? "on" : ""}
                onClick={() => {
                  setView(item.id);
                  setSelectedId(null);
                }}
              >
                {item.label}
                <b>{item.count}</b>
              </button>
            ))}
          </div>
          <button type="button" className={`ghost ${showColumns ? "on" : ""}`} onClick={() => setShowColumns((open) => !open)}>
            {showColumns ? "Fewer columns" : "Position & readiness"}
          </button>
        </div>
        <p className="queue-hint">
          {rows.length} shown. {selected ? `${selected.name} is open in the panel.` : "Select a row to open one event. Nothing else expands."}
          {query && (
            <button type="button" className="text-action" onClick={() => setQuery("")}>
              Clear search
            </button>
          )}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Deadline</th>
                {showColumns && (
                  <>
                    <th>Guests</th>
                    <th>Position</th>
                    <th>Readiness</th>
                    <th>Owner</th>
                  </>
                )}
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr
                  key={event.id}
                  className={`${event.id === selectedId ? "selected" : ""} ${role === "Finance" && event.depositOverdue > 0 ? "money-hot" : ""}`}
                  onClick={() => openEvent(event.id)}
                >
                  <td>
                    <strong>{event.name}</strong>
                    <span>
                      {event.client} · {event.type}
                    </span>
                  </td>
                  <td>
                    {event.serviceDeadline}
                    <span className={`pill ${tone(event.urgency)}`}>{event.deadlineNote}</span>
                  </td>
                  {showColumns && (
                    <>
                      <td className="num">{event.guests}</td>
                      <td>{event.financialPosition}</td>
                      <td>
                        <Readiness event={event} />
                        <span>{event.readinessSummary}</span>
                      </td>
                      <td>{event.owner}</td>
                    </>
                  )}
                  <td>
                    <button
                      type="button"
                      className="text-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEvent(event.id);
                      }}
                    >
                      {event.nextAction}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showColumns ? 7 : 3}>No events in this view match the search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lower" aria-label="Secondary queues">
        <article>
          <button type="button" className="lower-toggle" aria-expanded={openLower === "sales"} onClick={() => setOpenLower(openLower === "sales" ? null : "sales")}>
            <span>
              <p className="kicker">Sales</p>
              <strong>{quotes.length} quotes waiting</strong>
            </span>
            <em>{openLower === "sales" ? "Hide" : "Show"}</em>
          </button>
          {openLower === "sales" && (
            <>
              <ul>
                {quotes.map((event) => (
                  <li key={event.id}>
                    <button type="button" className="text-action" onClick={() => openEvent(event.id)}>
                      {event.name}
                    </button>
                    <span>{event.financialPosition}</span>
                  </li>
                ))}
              </ul>
              <Link to="/reservations">Open bookings</Link>
            </>
          )}
        </article>
        <article>
          <button type="button" className="lower-toggle" aria-expanded={openLower === "margin"} onClick={() => setOpenLower(openLower === "margin" ? null : "margin")}>
            <span>
              <p className="kicker">Margin</p>
              <strong>{thin.length} below 32%</strong>
            </span>
            <em>{openLower === "margin" ? "Hide" : "Show"}</em>
          </button>
          {openLower === "margin" && (
            <ul>
              {thin.map((event) => (
                <li key={event.id}>
                  <button type="button" className="text-action" onClick={() => openEvent(event.id)}>
                    {event.name}
                  </button>
                  <span>
                    {event.margin}% · missing {event.missingCosts[0] || "none"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article>
          <button type="button" className="lower-toggle" aria-expanded={openLower === "capacity"} onClick={() => setOpenLower(openLower === "capacity" ? null : "capacity")}>
            <span>
              <p className="kicker">Capacity</p>
              <strong>3 constraints this week</strong>
            </span>
            <em>{openLower === "capacity" ? "Hide" : "Show"}</em>
          </button>
          {openLower === "capacity" && (
            <>
              <ul>
                <li>Today 10:15 AM · one van, packing still open</li>
                <li>Tomorrow PM · captains free, purchasing late</li>
                <li>Friday · studio tasting holds the prep line</li>
              </ul>
              <Link to="/menu">Review menus</Link>
            </>
          )}
        </article>
      </section>

      {selected && (
        <EventDrawer
          key={selected.id}
          event={selected}
          role={role}
          onClose={() => setSelectedId(null)}
          onNext={() => {
            const index = rows.findIndex((item) => item.id === selected.id);
            const pool = rows.length ? rows : events;
            const next = pool[(index + 1) % pool.length];
            setSelectedId(next.id);
          }}
        />
      )}
    </div>
  );
}

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

function EventDrawer({
  event,
  role,
  onClose,
  onNext,
}: {
  event: EventRecord;
  role: Role;
  onClose: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [section, setSection] = useState(() => initialSection(event, role));
  const [more, setMore] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const attention = event.workstreams.filter((stream) => stream.status !== "ready");
  const ready = event.workstreams.filter((stream) => stream.status === "ready");

  function toggle(id: string) {
    setSection((current) => (current === id ? "" : id));
  }

  function act(message: string) {
    setNotice(message);
  }

  return (
    <aside className="drawer" aria-label="Event detail">
      <div className="drawer-top">
        <div>
          <p className="kicker">Event workspace</p>
          <h2>{event.name}</h2>
          <p className="sub">
            {event.serviceWhen} · {event.guests} guests · {event.location}
          </p>
        </div>
        <button ref={closeRef} type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <ol className="spine" aria-label="Event progress">
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
          </>
        )}
      </div>

      <div className="primary-action">
        <button type="button" className="solid" onClick={() => act(`${event.nextAction} opened for ${event.name}. Nothing was marked complete.`)}>
          {event.nextAction}
        </button>
        <button type="button" className="ghost" onClick={() => setMore((open) => !open)}>
          {more ? "Hide other actions" : "Other actions"}
        </button>
        {more && (
          <div className="alt-actions">
            <button type="button" onClick={() => act(`Deposit request drafted for ${event.client}. Not sent.`)}>
              Request deposit
            </button>
            <button type="button" onClick={() => act(`Menu revision opened for ${event.name}. BEO not published.`)}>
              Review menu
            </button>
            <button type="button" onClick={() => act(ownerDraft ? `${ownerDraft} assigned to ${event.name}.` : "Enter an owner name first.")}>
              Assign owner
            </button>
            <button type="button" onClick={() => act("Payment exception opened. Status was not changed to paid.")}>
              Inspect payment
            </button>
          </div>
        )}
        {more && (
          <label>
            Owner
            <input value={ownerDraft} onChange={(e) => setOwnerDraft(e.target.value)} placeholder="Name to assign" />
          </label>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </div>

      <Disclosure
        label="Payment states"
        hint={`${event.payment.customer} · ${event.payment.recon}`}
        open={section === "pay"}
        onToggle={() => toggle("pay")}
      >
        <dl className="pay-grid">
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
        <p className="mono">
          {event.payment.updated} · {event.payment.method} · {event.payment.required}
        </p>
      </Disclosure>

      <Disclosure
        label="Workstreams"
        hint={`${attention.length} need a look · ${ready.length} ready`}
        open={section === "work"}
        onToggle={() => toggle("work")}
      >
        {attention.map((stream) => (
          <Stream key={stream.name} stream={stream} />
        ))}
        {ready.length > 0 && (
          <button type="button" className="ghost wide" onClick={() => setShowReady((open) => !open)}>
            {showReady ? "Hide ready workstreams" : `Show ${ready.length} ready`}
          </button>
        )}
        {showReady && ready.map((stream) => <Stream key={stream.name} stream={stream} />)}
      </Disclosure>

      {event.marginAlert && (
        <Disclosure label="Margin change" hint={`${event.margin}% vs ${event.targetMargin}% target`} open={section === "margin"} onToggle={() => toggle("margin")}>
          <p>{event.marginAlert}</p>
          <div className="compare">
            <div>
              <span>Before</span>
              <strong>{money(event.marginBefore.revenue)}</strong>
              <em>
                Cost {money(event.marginBefore.cost)} · {event.marginBefore.margin}%
              </em>
            </div>
            <div>
              <span>After</span>
              <strong>{money(event.marginAfter.revenue)}</strong>
              <em>
                Cost {money(event.marginAfter.cost)} · {event.marginAfter.margin}%
              </em>
            </div>
          </div>
          <p>Missing costs: {event.missingCosts.length ? event.missingCosts.join(", ") : "None listed"}.</p>
          <p>
            Projected contribution {money(event.projectedContribution)}. These figures are not cash.
          </p>
        </Disclosure>
      )}

      <Disclosure label="Suggested step" hint="Needs your approval" open={section === "suggest"} onToggle={() => toggle("suggest")}>
        <h3>{event.ai.action}</h3>
        <p>
          <strong>Why now. </strong>
          {event.ai.why}
        </p>
        <p>
          <strong>If approved. </strong>
          {event.ai.ifApproved}
        </p>
        <p>
          <strong>Will not. </strong>
          {event.ai.willNot}
        </p>
        <button type="button" className="ghost" onClick={() => setShowRecords((open) => !open)}>
          {showRecords ? "Hide records" : "Which records"}
        </button>
        {showRecords && (
          <ul className="evidence">
            {event.ai.records.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
            <li>
              <strong>Unknown</strong>
              <span>{event.ai.unknown}</span>
            </li>
          </ul>
        )}
      </Disclosure>

      <Disclosure label="Evidence and history" hint={`${event.evidence.length} records`} open={section === "history"} onToggle={() => toggle("history")}>
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
          {event.blocker &&
            event.blocker.affects.map((item) => (
              <li key={item}>
                <strong>Affects</strong>
                <span>{item}</span>
              </li>
            ))}
        </ul>
      </Disclosure>

      <button type="button" className="ghost wide" onClick={onNext}>
        Next event in this view
      </button>
    </aside>
  );
}

function Stream({ stream }: { stream: EventRecord["workstreams"][number] }) {
  const [open, setOpen] = useState(stream.status === "blocked");
  return (
    <div className={`stream ${stream.status}`}>
      <header>
        <strong>{stream.name}</strong>
        <button type="button" className={`pill ${tone(stream.status)}`} onClick={() => setOpen((value) => !value)}>
          {open ? "Hide checks" : stream.status === "blocked" ? "Blocked" : stream.status}
        </button>
      </header>
      <p>{stream.summary}</p>
      {open && (
        <ul>
          {stream.checks.map((check) => (
            <li key={check.label} className={check.done ? "done" : ""}>
              {check.done ? "Done" : "Missing"} · {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
