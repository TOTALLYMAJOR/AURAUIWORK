export type QueueView = "action" | "upcoming" | "sales";

export type PaymentCustomer = "Not started" | "Processing" | "Succeeded" | "Failed";
export type FundsState = "Pending" | "Available";
export type PayoutState = "Not initiated" | "In transit" | "Paid" | "Failed";
export type ReconState = "Unmatched" | "Matched" | "Exception";

export interface Workstream {
  name: string;
  status: "ready" | "watch" | "blocked";
  summary: string;
  checks: { label: string; done: boolean }[];
}

export interface EventRecord {
  id: string;
  name: string;
  client: string;
  type: string;
  serviceWhen: string;
  serviceDeadline: string;
  deadlineNote: string;
  guests: number;
  owner: string;
  queue: QueueView[];
  urgency: "critical" | "soon" | "watch" | "ok";
  financialPosition: string;
  readinessSummary: string;
  nextAction: string;
  bookedValue: number;
  outstanding: number;
  depositOverdue: number;
  blockedValue: number;
  projectedContribution: number;
  margin: number;
  targetMargin: number;
  missingCosts: string[];
  marginAlert?: string;
  marginBefore: { revenue: number; cost: number; margin: number };
  marginAfter: { revenue: number; cost: number; margin: number };
  payment: {
    customer: PaymentCustomer;
    funds: FundsState;
    payout: PayoutState;
    recon: ReconState;
    method: string;
    required: string;
    policy: string;
    updated: string;
  };
  blocker: {
    title: string;
    resolveBy: string;
    ifMissed: string;
    affects: string[];
    cannotProceed: boolean;
  } | null;
  workstreams: Workstream[];
  spine: { label: string; state: "done" | "active" | "blocked" | "wait" }[];
  evidence: { label: string; detail: string; time: string }[];
  unknowns: string[];
  ai: {
    action: string;
    why: string;
    records: string[];
    unknown: string;
    ifApproved: string;
    willNot: string;
    sendsMessage: boolean;
  };
  location: string;
}

export const events: EventRecord[] = [
  {
    id: "rivera",
    name: "Rivera Summer Social",
    client: "Rivera Family",
    type: "Staffed buffet",
    serviceWhen: "Tomorrow, 5:00 PM",
    serviceDeadline: "Tomorrow, 5:00 PM",
    deadlineNote: "Service start",
    guests: 120,
    owner: "Maya Chen",
    queue: ["action", "upcoming"],
    urgency: "critical",
    financialPosition: "Deposit confirmation pending",
    readinessSummary: "Staffing ready; purchasing unresolved",
    nextAction: "Review payment exception",
    bookedValue: 18400,
    outstanding: 3250,
    depositOverdue: 3250,
    blockedValue: 18400,
    projectedContribution: 5120,
    margin: 27.8,
    targetMargin: 32,
    missingCosts: ["Ice & beverage rental", "Late-night staffing hours"],
    marginAlert:
      "Guest count rose from 96 to 120 without a matching price change. Review the change order before publishing the updated BEO.",
    marginBefore: { revenue: 15200, cost: 9800, margin: 35.5 },
    marginAfter: { revenue: 18400, cost: 13280, margin: 27.8 },
    payment: {
      customer: "Processing",
      funds: "Pending",
      payout: "Not initiated",
      recon: "Exception",
      method: "Card via Stripe",
      required: "$3,250 deposit",
      policy:
        "Production release for card deposits requires a succeeded payment of at least the configured deposit. Cleared funds and bank payout are not required. Accounting match is tracked separately.",
      updated: "Payments updated 2 minutes ago",
    },
    blocker: {
      title: "Required deposit status has not been confirmed.",
      resolveBy: "Today, 3:00 PM",
      ifMissed: "Kitchen will not receive a production release. Prep for tomorrow’s 5:00 PM service slips to a same-day rush.",
      affects: ["Production release", "Purchasing hold", "Event value $18,400 — not an estimated loss"],
      cannotProceed: true,
    },
    workstreams: [
      {
        name: "Commercial",
        status: "blocked",
        summary: "Contract accepted. Deposit not confirmed.",
        checks: [
          { label: "Contract accepted", done: true },
          { label: "Latest scope approved", done: true },
          { label: "Required payment confirmed", done: false },
        ],
      },
      {
        name: "Menu and purchasing",
        status: "watch",
        summary: "Guest count confirmed. Two ingredients not ordered.",
        checks: [
          { label: "Guest count confirmed", done: true },
          { label: "Dietary requirements reviewed", done: true },
          { label: "Ingredients allocated or ordered", done: false },
        ],
      },
      {
        name: "Kitchen",
        status: "watch",
        summary: "BEO draft exists. Not published.",
        checks: [
          { label: "Current BEO published", done: false },
          { label: "Production schedule assigned", done: true },
          { label: "Prep and packing acknowledged", done: false },
        ],
      },
      {
        name: "Staffing",
        status: "ready",
        summary: "Required roles filled and accepted.",
        checks: [
          { label: "Required roles filled", done: true },
          { label: "Assignments accepted", done: true },
        ],
      },
      {
        name: "Delivery and service",
        status: "watch",
        summary: "Driver assigned. Venue access unconfirmed.",
        checks: [
          { label: "Vehicle and driver assigned", done: true },
          { label: "Venue access confirmed", done: false },
          { label: "Setup timing approved", done: true },
        ],
      },
    ],
    spine: [
      { label: "Inquiry", state: "done" },
      { label: "Proposal", state: "done" },
      { label: "Accepted", state: "done" },
      { label: "Deposit", state: "blocked" },
      { label: "BEO", state: "wait" },
      { label: "Production", state: "wait" },
      { label: "Service", state: "wait" },
    ],
    evidence: [
      { label: "PaymentIntent", detail: "pi_rivera_3250 is processing — not succeeded.", time: "2 min ago" },
      { label: "Contract", detail: "Deposit of $3,250 due before production release.", time: "Yesterday" },
      { label: "Change order", detail: "Guests 96 → 120. Price not revised.", time: "4 hr ago" },
      { label: "Inventory sync", detail: "Failed. Citrus and brioche not allocated.", time: "18 min ago" },
    ],
    unknowns: ["Whether the card will succeed before 3:00 PM", "Whether the client approved the guest-count price"],
    ai: {
      action: "Review the payment exception for Rivera Summer Social before the production cutoff.",
      why: "It is the only event with a same-day production-release cutoff and an unconfirmed required deposit.",
      records: ["Contract deposit clause", "Stripe payment still processing", "BEO unpublished"],
      unknown: "Card outcome and whether finance will grant a same-day exception.",
      ifApproved: "Opens the payment exception. Does not mark the event paid.",
      willNot: "Will not publish the BEO, message the client, or release the kitchen.",
      sendsMessage: false,
    },
    location: "Harbor House",
  },
  {
    id: "corp-lunch",
    name: "Corporate lunch",
    client: "Northline Labs",
    type: "Drop-off",
    serviceWhen: "Today, 11:30 AM",
    serviceDeadline: "Today, 11:30 AM",
    deadlineNote: "Drop-off window",
    guests: 45,
    owner: "Jules Park",
    queue: ["action", "upcoming"],
    urgency: "critical",
    financialPosition: "Paid; projected margin 29%",
    readinessSummary: "Packing incomplete",
    nextAction: "Complete packing checklist",
    bookedValue: 2140,
    outstanding: 0,
    depositOverdue: 0,
    blockedValue: 2140,
    projectedContribution: 620,
    margin: 29,
    targetMargin: 32,
    missingCosts: ["Parking fee"],
    marginAlert: "A parking fee was omitted. Adding it drops projected margin from 31% to 29%.",
    marginBefore: { revenue: 2140, cost: 1476, margin: 31 },
    marginAfter: { revenue: 2140, cost: 1520, margin: 29 },
    payment: {
      customer: "Succeeded",
      funds: "Available",
      payout: "In transit",
      recon: "Matched",
      method: "ACH",
      required: "Paid in full",
      policy: "Drop-off release requires a succeeded payment. Payout in transit does not block packing.",
      updated: "Payments updated 14 minutes ago",
    },
    blocker: {
      title: "Packing checklist is incomplete for a drop-off leaving in the next service window.",
      resolveBy: "Today, 10:15 AM",
      ifMissed: "Driver leaves without labeled allergens. On-site correction is not possible for drop-off.",
      affects: ["Delivery handoff", "Event value $2,140 — not an estimated loss"],
      cannotProceed: true,
    },
    workstreams: [
      {
        name: "Commercial",
        status: "ready",
        summary: "Paid in full. Scope locked.",
        checks: [
          { label: "Contract accepted", done: true },
          { label: "Latest scope approved", done: true },
          { label: "Required payment confirmed", done: true },
        ],
      },
      {
        name: "Menu and purchasing",
        status: "ready",
        summary: "Packed from house inventory.",
        checks: [
          { label: "Guest count confirmed", done: true },
          { label: "Dietary requirements reviewed", done: true },
          { label: "Ingredients allocated or ordered", done: true },
        ],
      },
      {
        name: "Kitchen",
        status: "blocked",
        summary: "Two trays unlabeled. Allergen card missing.",
        checks: [
          { label: "Current BEO published", done: true },
          { label: "Production schedule assigned", done: true },
          { label: "Prep and packing acknowledged", done: false },
        ],
      },
      {
        name: "Staffing",
        status: "ready",
        summary: "Driver only. Accepted.",
        checks: [
          { label: "Required roles filled", done: true },
          { label: "Assignments accepted", done: true },
        ],
      },
      {
        name: "Delivery and service",
        status: "watch",
        summary: "Vehicle assigned. Dock code pending.",
        checks: [
          { label: "Vehicle and driver assigned", done: true },
          { label: "Venue access confirmed", done: false },
          { label: "Setup timing approved", done: true },
        ],
      },
    ],
    spine: [
      { label: "Inquiry", state: "done" },
      { label: "Proposal", state: "done" },
      { label: "Accepted", state: "done" },
      { label: "Deposit", state: "done" },
      { label: "BEO", state: "done" },
      { label: "Production", state: "blocked" },
      { label: "Service", state: "wait" },
    ],
    evidence: [
      { label: "Payment", detail: "ACH succeeded. Funds available. Payout in transit.", time: "14 min ago" },
      { label: "Packing", detail: "Trays 3 and 4 not scanned. Allergen card unsigned.", time: "9 min ago" },
    ],
    unknowns: ["Dock code from building security"],
    ai: {
      action: "Complete the packing checklist before the 10:15 AM driver cutoff.",
      why: "Payment is already confirmed. The only cannot-proceed item is packing, and service is today.",
      records: ["Published BEO", "Unscanned trays", "Succeeded ACH"],
      unknown: "Dock access code.",
      ifApproved: "Opens the packing checklist for the operator to mark. Does not auto-complete it.",
      willNot: "Will not message the client or change the invoice.",
      sendsMessage: false,
    },
    location: "Northline HQ",
  },
  {
    id: "wedding",
    name: "Wedding reception",
    client: "Adeyemi & Cole",
    type: "Plated service",
    serviceWhen: "In 8 days",
    serviceDeadline: "Sat, 6:30 PM",
    deadlineNote: "Balance due in 3 days",
    guests: 180,
    owner: "Unassigned",
    queue: ["action", "upcoming"],
    urgency: "watch",
    financialPosition: "Balance due in 3 days",
    readinessSummary: "Menu revision awaiting approval",
    nextAction: "Review revised menu",
    bookedValue: 42600,
    outstanding: 21300,
    depositOverdue: 0,
    blockedValue: 42600,
    projectedContribution: 9800,
    margin: 23,
    targetMargin: 32,
    missingCosts: ["Chair rental", "Overtime captains"],
    marginAlert:
      "The revised menu substitutes wagyu for hangar steak and raises recipe cost. Projected margin falls from 31% to 23%.",
    marginBefore: { revenue: 42600, cost: 29394, margin: 31 },
    marginAfter: { revenue: 42600, cost: 32800, margin: 23 },
    payment: {
      customer: "Succeeded",
      funds: "Available",
      payout: "Paid",
      recon: "Matched",
      method: "Wire",
      required: "50% deposit received",
      policy: "Balance is due 5 days before service. It does not block menu review. It will block final BEO publish if unpaid at cutoff.",
      updated: "Payments updated 1 hour ago",
    },
    blocker: {
      title: "Menu revision is awaiting approval and drops margin below the 32% target.",
      resolveBy: "Thu, 12:00 PM",
      ifMissed: "Kitchen keeps the prior menu. The client-facing BEO stays unpublished and purchasing uses the old count.",
      affects: ["BEO publish", "Purchasing", "Projected margin"],
      cannotProceed: false,
    },
    workstreams: [
      {
        name: "Commercial",
        status: "watch",
        summary: "Deposit received. Balance due in 3 days.",
        checks: [
          { label: "Contract accepted", done: true },
          { label: "Latest scope approved", done: false },
          { label: "Required payment confirmed", done: true },
        ],
      },
      {
        name: "Menu and purchasing",
        status: "blocked",
        summary: "Revision not approved. Costs incomplete.",
        checks: [
          { label: "Guest count confirmed", done: true },
          { label: "Dietary requirements reviewed", done: true },
          { label: "Ingredients allocated or ordered", done: false },
        ],
      },
      {
        name: "Kitchen",
        status: "watch",
        summary: "Prior BEO on file. Revision not published.",
        checks: [
          { label: "Current BEO published", done: false },
          { label: "Production schedule assigned", done: false },
          { label: "Prep and packing acknowledged", done: false },
        ],
      },
      {
        name: "Staffing",
        status: "watch",
        summary: "Captains open. Servers filled.",
        checks: [
          { label: "Required roles filled", done: false },
          { label: "Assignments accepted", done: false },
        ],
      },
      {
        name: "Delivery and service",
        status: "watch",
        summary: "Venue hold confirmed. Load-in time open.",
        checks: [
          { label: "Vehicle and driver assigned", done: false },
          { label: "Venue access confirmed", done: true },
          { label: "Setup timing approved", done: false },
        ],
      },
    ],
    spine: [
      { label: "Inquiry", state: "done" },
      { label: "Proposal", state: "done" },
      { label: "Accepted", state: "done" },
      { label: "Deposit", state: "done" },
      { label: "BEO", state: "blocked" },
      { label: "Production", state: "wait" },
      { label: "Service", state: "wait" },
    ],
    evidence: [
      { label: "Menu rev 4", detail: "Wagyu substitution. Recipe cost +$3,406.", time: "Yesterday" },
      { label: "Deposit", detail: "Wire matched. Balance invoice open.", time: "6 days ago" },
    ],
    unknowns: ["Client approval of the price hold on the substitution", "Captain availability"],
    ai: {
      action: "Review the revised menu and its margin before Thursday’s approval cutoff.",
      why: "The change is not urgent today, but it silently drops contribution below target if published as-is.",
      records: ["Menu rev 4 costing", "Target margin 32%", "Open balance invoice"],
      unknown: "Whether the client will accept a price adjustment.",
      ifApproved: "Opens the menu comparison. Does not publish the BEO.",
      willNot: "Will not email the couple or lock purchasing.",
      sendsMessage: false,
    },
    location: "Glasshouse",
  },
  {
    id: "harbor-tasting",
    name: "Harbor tasting",
    client: "Ellis Co.",
    type: "Plated tasting",
    serviceWhen: "Fri, 1:00 PM",
    serviceDeadline: "Fri, 1:00 PM",
    deadlineNote: "Proposal follow-up due Thu",
    guests: 8,
    owner: "Sam Ortiz",
    queue: ["sales", "upcoming"],
    urgency: "ok",
    financialPosition: "Proposal sent · $6,800",
    readinessSummary: "Awaiting client reply",
    nextAction: "Send follow-up",
    bookedValue: 0,
    outstanding: 0,
    depositOverdue: 0,
    blockedValue: 0,
    projectedContribution: 2100,
    margin: 31,
    targetMargin: 32,
    missingCosts: [],
    marginBefore: { revenue: 6800, cost: 4690, margin: 31 },
    marginAfter: { revenue: 6800, cost: 4690, margin: 31 },
    payment: {
      customer: "Not started",
      funds: "Pending",
      payout: "Not initiated",
      recon: "Unmatched",
      method: "Not invoiced",
      required: "No deposit until accepted",
      policy: "Sales follow-up does not touch production. No release rule applies.",
      updated: "Quote untouched for 3 days",
    },
    blocker: null,
    workstreams: [
      {
        name: "Commercial",
        status: "watch",
        summary: "Proposal open. No contract.",
        checks: [
          { label: "Proposal sent", done: true },
          { label: "Follow-up logged", done: false },
          { label: "Required payment confirmed", done: false },
        ],
      },
      {
        name: "Menu and purchasing",
        status: "ready",
        summary: "Tasting menu locked for Friday.",
        checks: [
          { label: "Tasting menu set", done: true },
          { label: "Dietary notes captured", done: true },
        ],
      },
      {
        name: "Kitchen",
        status: "ready",
        summary: "Tasting prep on Friday AM board.",
        checks: [{ label: "Prep slot reserved", done: true }],
      },
      {
        name: "Staffing",
        status: "ready",
        summary: "Chef and one server held.",
        checks: [{ label: "Roles held", done: true }],
      },
      {
        name: "Delivery and service",
        status: "ready",
        summary: "On-site at the kitchen studio.",
        checks: [{ label: "Room reserved", done: true }],
      },
    ],
    spine: [
      { label: "Inquiry", state: "done" },
      { label: "Proposal", state: "active" },
      { label: "Accepted", state: "wait" },
      { label: "Deposit", state: "wait" },
      { label: "BEO", state: "wait" },
      { label: "Production", state: "wait" },
      { label: "Service", state: "wait" },
    ],
    evidence: [{ label: "Quote Q-441", detail: "Sent Monday. No open recorded.", time: "3 days ago" }],
    unknowns: ["Whether Ellis Co. is comparing two caterers"],
    ai: {
      action: "Draft a deposit-free follow-up for the Harbor tasting. Do not send it automatically.",
      why: "The quote has been quiet for 3 days and Friday’s tasting still has a held prep slot.",
      records: ["Quote Q-441", "Studio hold Friday 1:00 PM"],
      unknown: "Competing proposals.",
      ifApproved: "Saves a draft in the event. Does not email the client.",
      willNot: "Will not create an invoice or release any kitchen work.",
      sendsMessage: false,
    },
    location: "Studio",
  },
  {
    id: "board-dinner",
    name: "Board dinner",
    client: "Keel & March",
    type: "Plated service",
    serviceWhen: "In 12 days",
    serviceDeadline: "In 12 days, 7:00 PM",
    deadlineNote: "Proposal expires Friday",
    guests: 22,
    owner: "Sam Ortiz",
    queue: ["sales"],
    urgency: "watch",
    financialPosition: "Quote aging · $9,400",
    readinessSummary: "Menu options ready",
    nextAction: "Request decision",
    bookedValue: 0,
    outstanding: 0,
    depositOverdue: 0,
    blockedValue: 0,
    projectedContribution: 3200,
    margin: 34,
    targetMargin: 32,
    missingCosts: [],
    marginBefore: { revenue: 9400, cost: 6200, margin: 34 },
    marginAfter: { revenue: 9400, cost: 6200, margin: 34 },
    payment: {
      customer: "Not started",
      funds: "Pending",
      payout: "Not initiated",
      recon: "Unmatched",
      method: "Not invoiced",
      required: "Deposit on acceptance",
      policy: "No production release until the proposal is accepted.",
      updated: "Quote sent 5 days ago",
    },
    blocker: null,
    workstreams: [
      {
        name: "Commercial",
        status: "watch",
        summary: "Two menu options. No decision.",
        checks: [
          { label: "Proposal sent", done: true },
          { label: "Decision requested", done: false },
        ],
      },
      {
        name: "Menu and purchasing",
        status: "ready",
        summary: "Both options costed.",
        checks: [{ label: "Options costed", done: true }],
      },
      {
        name: "Kitchen",
        status: "watch",
        summary: "No BEO until accepted.",
        checks: [{ label: "Current BEO published", done: false }],
      },
      {
        name: "Staffing",
        status: "watch",
        summary: "Not held.",
        checks: [{ label: "Roles filled", done: false }],
      },
      {
        name: "Delivery and service",
        status: "watch",
        summary: "Private dining room penciled.",
        checks: [{ label: "Venue access confirmed", done: false }],
      },
    ],
    spine: [
      { label: "Inquiry", state: "done" },
      { label: "Proposal", state: "active" },
      { label: "Accepted", state: "wait" },
      { label: "Deposit", state: "wait" },
      { label: "BEO", state: "wait" },
      { label: "Production", state: "wait" },
      { label: "Service", state: "wait" },
    ],
    evidence: [{ label: "Quote Q-448", detail: "Expires Friday. Margin holds at 34% on both options.", time: "5 days ago" }],
    unknowns: ["Which menu the board prefers"],
    ai: {
      action: "Request a decision on quote Q-448 before it expires Friday.",
      why: "The quote is healthy on margin and will otherwise age out of the week’s pipeline.",
      records: ["Quote Q-448", "Both menus costed"],
      unknown: "Menu preference.",
      ifApproved: "Drafts a decision request. Does not send it.",
      willNot: "Will not book staff or create a BEO.",
      sendsMessage: false,
    },
    location: "Keel offices",
  },
];

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const stageCounts = [
  { label: "Inquiry", count: 4 },
  { label: "Proposal", count: 6 },
  { label: "Accepted", count: 11 },
  { label: "Deposit", count: 3 },
  { label: "BEO", count: 5 },
  { label: "Production", count: 2 },
  { label: "Service", count: 1 },
];
