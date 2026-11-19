# LAU Course Map

An interactive course planner for Lebanese American University undergraduates.
Plan your degree term by term, track grades and GPA, and catch prerequisite
problems before registration rather than after it.

Currently covers **Mechanical Engineering**, study plan effective Fall 2026.

## Features

- **Drag and drop** courses between terms. Every term re-validates on the spot.
- **Prerequisite checking** against the LAU catalog, not only the flow chart.
  The chart under-reports: MEE212 needs GNE333, and the lab courses MEE404 and
  MEE443 need GNE331. Cards carrying a prerequisite the chart omits are marked
  **H**, and the warning says so.
- **Corequisites and concurrency** handled separately. A corequisite may sit in
  the same term or earlier; a course listed as *concurrent with* another must
  share its term exactly.
- **Class standing gates.** MEE301 and MEE321 need second-year standing,
  INE320 and MEE491 third-year, MEE498 and the projects fifth-year. None of
  this appears on the chart.
- **Credit limits** per LAU rules: 18 in fall and spring, 9 in summer, 21 once
  your cumulative GPA reaches 3.00, 13 while on probation. The cap shown on
  each term updates as your GPA changes.
- **Offering warnings.** Move a course out of the term the study plan puts it
  in and it is flagged, because it may not be taught that term.
- **Grades and GPA.** Full LAU scale with quality points. Cumulative and major
  GPA, with only the latest attempt of a repeated course counted, as LAU does.
- **Course states**: completed and struck through, failed, or withdrawn with
  WI, WP and WF kept distinct since only WF counts as a repeat.
- **Term locking** once you have actually registered. A locked term is
  highlighted and refuses changes.
- **Requirement tracking** for the LAS Z2026 categories, technical electives,
  the SDG restricted elective and the SOE signature requirement.
- **SOE signature is counted in credits, not courses**, because VIP+ courses
  substitute for it and come in 1, 2 and 3 credit versions that stack. Pick
  from VIP201 through VIP403, and add as many slots as you need until the six
  credits are covered.
- **Advisor override** per course, for when a waiver beats the rulebook.
- Saves to the browser automatically, with JSON export and import.

Courses the plan does not schedule — the freshman English pair ENG101 and
ENG102, for instance — sit in **Unplaced** so you can drag them onto the board
if you actually took them. They count as satisfied for prerequisite purposes
either way, since entry credits already cover them.

## Running it

Open `index.html` in a browser. No build step, no server.

To serve it instead:

```
python -m http.server 8777
```

Type is Archivo and Space Mono from Google Fonts. Offline, the page falls back
to Helvetica and a system monospace; the layout does not shift.

## Design

Neo-brutalist: a white sheet on a warm ground, 3px black rules, flat saturated
colour and hard offset shadows. No radii, no gradients.

Colour carries meaning rather than decoration. Each course category owns one
fill — red for the MEE core, yellow for maths and science, blue for common
engineering, green for LAS, black for electives — and course *state* is told
some other way, so the two never compete: diagonal hatching for completed,
greyscale for withdrawn, a red shadow for failed, and a black-and-yellow
hazard band for anything with a conflict.

## Adding another program

Course data lives in `data/mee.js` as plain data. Copy it, change the plan id
at the top, and add a `<script>` tag for the new file in `index.html`.

A slot (`"slot": "technical"`, `"soe"`, `"las"`, …) is a placeholder the
student fills in. Give its `slotOptions` entry a `creditsRequired` and the
requirement is measured in credits rather than courses.

Prerequisites are stored as an AND of OR groups, so
`[["MEE311", "CIE320"], ["MTH304"]]` reads as *(MEE311 or CIE320) and MTH304*.

The file is JavaScript rather than JSON so the page works when opened straight
from disk; browsers refuse `fetch()` on `file://` URLs.

## Known gaps

- Class standing thresholds are approximated at 30, 60, 90 and 120 credits.
  LAU states standing in prerequisites but publishes the thresholds elsewhere.
- The major GPA course set is a reasonable default, not an official definition.
- Drag and drop uses the HTML5 API, which does not fire on touch screens. On a
  phone, move a course with the Placement menu in its detail panel.

## Accuracy

Course data is transcribed from the official LAU Mechanical Engineering flow
chart and the LAU academic catalog. It is a planning aid, not an official
record. Always confirm your plan with your academic advisor and the Registrar.

## License

MIT
