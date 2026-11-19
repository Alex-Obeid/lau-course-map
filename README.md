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
  in and the card is marked, because it may not be taught that term. The
  reason shows in the course's detail panel. These stay off the Conflicts
  list, which is kept for things that would actually block a registration.
- **Grades and GPA.** Full LAU scale with quality points. Cumulative and major
  GPA, with only the latest attempt of a repeated course counted, as LAU does.
- **Course states**: completed and struck through, failed, or withdrawn.
  A withdrawal is greyed, struck through corner to corner and labelled in
  words, since it changes what you still owe. WI, WP and WF stay distinct
  because only WF counts as a repeat.
- **Term status**: Plan, Registered, In progress or Complete. Registered and
  Complete freeze the term against edits; In progress leaves it editable.
  Each status colours the term rail, and finishing one is celebrated.
- **Collapsible years.** Fold a whole academic year away once it is behind
  you; the year band keeps showing its credits and how many terms are done.
- **Drag to reorder**, inside a term as well as between terms. A ghost marks
  where the card will land before you let go.
- **A side tray** holds unplaced courses in a column beside the board, so you
  can drag straight onto a term. Below 1080px it becomes a drawer that slides
  in from the right.
- **Requirement rows are colour-coded** to the area they belong to, matching
  the cards and the index.
- **Finish the degree** and the page says so properly.
- **Requirement tracking** by CAPP area, plus the LAS Z2026 categories,
  technical electives, the SDG restricted elective and the SOE signature.
- **SOE signature is counted in credits, not courses**, because VIP+ courses
  substitute for it and come in 1, 2 and 3 credit versions that stack. Pick
  from VIP201 through VIP403, and add as many slots as you need until the six
  credits are covered.
- **Advisor override** per course, for when a waiver beats the rulebook.
- Saves to the browser automatically, with JSON export and import.

The header carries the wordmark, the study plan it is effective for, and the
program and institution, then the tool begins below a break.

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

## Requirement areas

Courses are grouped the way LAU's CAPP degree evaluation groups them, and the
colours follow that grouping rather than the course code. The areas add up to
the 180 credits the degree requires:

| Area | Credits | Colour |
|---|---|---|
| Mechanical Eng. Major (course list + technical electives) | 88 | red, black |
| Math and Science | 21 | pink |
| General Engineering | 23 | blue |
| LASCZ Core | 6 | yellow |
| LAS Elective, Curriculum Z | 12 | green |
| Basic English | 6 | orange |
| Baccalaureate (transfer credit) | 24 | not placed on the board |

The split is not what the course codes suggest. **CIE200 Statics sits under
Math and Science**, and **MEE211 Engineering Graphics under General
Engineering**, despite the MEE prefix. GNE331 and GNE333 are Math and Science;
COE212, ELE305, GNE301, GNE303, INE320 and INE428 are General Engineering.
None of them count toward the major GPA.

**Major GPA** is computed over the 88-credit major area and nothing else.

**Baccalaureate credit** is 24, not 30. ENG101 and ENG102 make up the rest of
the freshman-year total, but they are real graded courses that count toward
the CGPA, so they live on the board rather than in the entry figure.

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
- CAPP leaves failed required courses out of its own major GPA until the major
  is complete. This tool counts them, per the academic rules, so the two can
  differ while courses are outstanding.
- Drag and drop uses the HTML5 API, which does not fire on touch screens. On a
  phone, move a course with the Placement menu in its detail panel.

## Accuracy

Course data is transcribed from the official LAU Mechanical Engineering flow
chart and the LAU academic catalog. It is a planning aid, not an official
record. Always confirm your plan with your academic advisor and the Registrar.

## License

MIT
