# Staffing and inventory integration

## Scope and source

The user-supplied `QuietPilot-Staffing-Inventory.zip` is integrated into
`Aura-UI-1`, alongside Command, Menu, and Bookings. It is not installed into the
separate QuietPilot application checkout. No existing pages are retired.

The archive passed relative-path, duplicate-path, symlink, size, and CRC checks.
Only its relevant sample records and operational patterns were adopted. Its
package/config files, npm cache, custom cursor, global motion, replacement shell,
and claims that catering/bookings were retired were not imported.

## Outcome contract

- Operator can inspect coverage, carry an explicit shift into crew review, and
  prepare a local offer draft; stock can be filtered and collected into a local
  pull-list draft.
- Success signal: local browser checks of routes, filters, empty states,
  keyboard activation, draft invalidation, and no mutation of fixture counts.
- Primary workstream: additive prototype workflow integration. Reviewer
  workstream: focused behavior, accessibility, and rendered-layout checks.
- Surfaces: `src/App.tsx`, `src/components/Shell.tsx`, navigation wrapping in
  `src/styles.css`, `src/pages/Staffing.tsx`, `src/staffing/`, and
  `e2e/staffing.spec.ts`.
- Dependencies: existing React/router/UI packages only; no new runtime package.
- Approval boundary: no external writes, database integration, commit, push,
  deployment, or operational release is authorized by this integration.

## Behavior and truth boundaries

- `/staffing`: coverage filters and counts use the visible shifts. Detail
  selection cannot remain outside the selected filter. Keel's source label
  `filled` contradicts its four-of-six count; the record is retained and its
  mismatch displayed. Coverage never implies accepted staffing.
- `/roster?shift=<id>`: the staffing action passes the selected sample shift.
  Missing/invalid targets remain unset. Crew selection and an explicit shift
  are required; off-duty crew cannot receive even a draft here. Other schedule,
  hold, qualification, and full-coverage concerns remain review requirements.
  Drafts clear on target, crew, or filter edits. No offer is sent or accepted.
- `/inventory`: category/search constrain both the table and selected detail.
  Empty results remove the action target. The pull-list draft explicitly spans
  all categories, including filtered-out items, and allows removal or clearing.
  It contains no allocated quantities and does not reserve or decrement stock.
- Drafts are page-local and clear on navigation/reload. No persistence implied.
- No booking IDs, absolute service dates, acceptance evidence, event-specific
  stock requirements, or reservation records exist in this source. Matching
  venue names are not authority to join these records to Command Center events.
- Stock par is a target, not a universal release gate. Source stock labels are
  sample classifications, not verified availability or procurement decisions.

## Design adoption

The supplied shift cards, roster choices, stock table, and detail patterns fit
the existing dense operator workspace. Existing candidate colors, type,
navigation, and native controls are preserved. The marketing hero/archive and
global effects were excluded; this task is additive wiring, not aesthetic
retuning. On mobile, filters precede the cards/table, then selected detail and
draft. The stock table alone scrolls horizontally and is keyboard-focusable.

## Validation

Use Node 22 and the existing commands in `CORRECTION-NOTES.md`:
`npm run typecheck`, `npm run build`, `npm run test:e2e`, `git diff --check`.
The staffing suite adds coverage/filter consistency, explicit route context,
invalid targets, off-duty restrictions, offer invalidation, keyboard activation,
inventory empty states, draft removal/reset, and unchanged fixture counts.
Rendered checks and serious/critical axe scans cover all three new routes at
1440, 1024, 768, and 390 pixels, including prepared draft states.

These are local Chromium checks, not live integration, cross-browser,
deployment, human acceptance, or production readiness evidence.

## Lesson

### Trigger
An imported prototype labeled a partially covered shift as filled and implied
that coverage counts and stock par authorized release.

### Root Cause
Presentation labels substituted for missing acceptance and event requirements.

### Prevention Rule
Keep source records traceable, expose contradictions, and do not derive
operational authority from counts, matching names, or prototype prose.

### Verification
The coverage test includes the inconsistent Keel shift; offer and inventory
tests assert that drafting leaves counts unchanged and reports no commitment.
