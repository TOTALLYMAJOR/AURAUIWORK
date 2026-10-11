# Focused behavior correction

Candidate: `Aura-UI-1`, based on repository commit
`00d330552346d2baefda5e24b1537c39d4468f68`. The original `Aura-UI` is unchanged.

## Scope contract

- Search matches event, client, owner, and next-action text. The selected queue
  narrows those matches. Snapshot totals, missing-cost details, priority, selected
  event, and next-event navigation use that narrowed set.
- Queue counts and secondary queues use search matches across queue views.
  Selecting a secondary result switches to a queue that contains it.
- Changes to search, role, or queue close the previous event. Empty results show
  no suggested action, zero totals, and no stale drawer.
- Date and kitchen controls are explicitly unavailable: the fixtures have
  relative display dates and venue locations, not calendar dates and kitchen
  assignments. No dates or assignments were fabricated. Company-wide stage,
  capacity, and connection examples are labeled as unfiltered sample data.

## Keyboard and booking behavior

- Event names and actions are native buttons; view filters use `aria-pressed`.
  Tab, Enter, Space, Escape, focus return, and next-event navigation are covered
  by browser tests. Scrollable event progress and queue regions are focusable.
- Opening a drawer focuses Close once. Editing drawer inputs does not steal
  focus. Reopening the current panel focuses it, and closing returns focus to
  the opener or an appropriate event button.
- Service type and guest count begin unset. Optional notes and service choices
  survive collapse. A prepared inquiry reflects submitted values, clears after
  edits, and explicitly states that it is only a draft on this page. It does
  not create a booking, mark a deposit received, or persist across navigation.
- Secondary and red text contrast, focus outlines, a stray CSS declaration,
  and drawer flex compression were corrected as supporting accessibility fixes.

## Run and validate

Use Node 22 (`nvm use`), then:

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm run build
npm run test:e2e
git diff --check
```

The tests start one loopback-only Vite server on port 4179. The suite covers
scope transitions, keyboard interactions, booking validation, route navigation,
serious/critical axe violations in affected open states, and widths of
1440, 1280, 1024, 768, and 390 pixels. Screenshots are generated under
`test-results/`; these are inspection evidence, not approved design baselines.

## Remaining boundaries

- This is a fixture-based prototype. Date/kitchen filtering requires real data
  fields; inquiry persistence requires an application integration.
- No application changes were applied to the separate QuietPilot checkout.
- Existing dependency advisories remain. Installation reported four overall;
  the production-only audit reported two moderate React Router entries with a
  major-version remediation. No unrelated dependency migration was performed.
- Chromium is the browser tested here; cross-browser and hosted acceptance are
  outside this local correction pass.

## Lesson

Disclosure visibility must not implicitly erase entered data. Derived summaries
must share their stated scope, and success messages must describe the operation
that actually occurred. Keyboard checks and screenshot inspection complement
automated accessibility scans: the scan alone did not identify vertically
compressed progress labels.
