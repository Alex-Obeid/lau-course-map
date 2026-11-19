/* LAU Course Map
   State lives in localStorage; the board re-renders wholesale on every change,
   which is cheap at this size and keeps the data the single source of truth. */

(function () {
  'use strict';

  var PLAN_ID = 'lau-mee-2026f';
  var STORE_KEY = 'lau-course-map:' + PLAN_ID;
  var TERM_ORDER = ['fall', 'spring', 'summer'];
  var TERM_OFFSET = { fall: 0, spring: 1, summer: 1 };

  // A term moves through these. Frozen ones refuse edits; the board should
  // not let you reshuffle something you have already registered or finished.
  var TERM_STATUS = {
    planned:    { label: 'Planned',    button: 'Plan',        frozen: false },
    registered: { label: 'Registered', button: 'Registered',  frozen: true  },
    active:     { label: 'In progress',button: 'In progress', frozen: false },
    done:       { label: 'Complete',   button: 'Complete',    frozen: true  }
  };

  var plan = (window.PLANS || {})[PLAN_ID];
  var state = null;
  var uidSeq = 0;

  /* ------------------------------------------------------------- utilities */

  function $(id) { return document.getElementById(id); }

  function setText(id, value) {
    var node = $(id);
    if (node) node.textContent = value;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function uid() {
    uidSeq += 1;
    return 'i' + Date.now().toString(36) + uidSeq.toString(36);
  }

  function titleCase(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  /* ----------------------------------------------------------- plan lookup */

  var courseById = {};
  plan.courses.forEach(function (c) { courseById[c.id] = c; });

  var gradeByLetter = {};
  plan.grades.forEach(function (g) { gradeByLetter[g.letter] = g; });

  var slotOptionByCode = {};
  Object.keys(plan.slotOptions).forEach(function (k) {
    (plan.slotOptions[k].options || []).forEach(function (o) {
      slotOptionByCode[o.code] = o;
    });
  });

  var templateTermOf = {};
  plan.template.forEach(function (row) {
    row.courses.forEach(function (id) { templateTermOf[id] = row.term; });
  });

  // Display name for anything a prerequisite can point at.
  function nameOf(code) {
    if (courseById[code]) return code + ' ' + courseById[code].title;
    if (slotOptionByCode[code]) return code + ' ' + slotOptionByCode[code].title;
    var ext = plan.externalCourses && plan.externalCourses[code];
    if (ext) return code + ' ' + ext.title;
    return code;
  }

  function isFreshmanCourse(code) {
    var own = courseById[code];
    if (own && own.freshman) return true;
    var ext = plan.externalCourses && plan.externalCourses[code];
    return !!(ext && ext.freshman);
  }

  /* --------------------------------------------------- effective course view
     A slot course (Technical Elective, LAS, Science) carries whatever the
     student picked for it. Everything else is the catalog entry as-is. */

  function identity(item) {
    var eff = effective(item);
    return eff.code || item.ref;
  }

  function effective(item) {
    var base = courseById[item.ref];
    var out = {
      id: base.id,
      slot: base.slot || null,
      category: base.category,
      code: base.code || null,
      title: base.title,
      credits: base.credits,
      prereqs: base.prereqs || [],
      coreqs: base.coreqs || [],
      concurrent: base.concurrent || [],
      standing: base.standing || null,
      hiddenPrereq: base.hiddenPrereq || null,
      isLab: !!base.isLab,
      requiresConsent: !!base.requiresConsent
    };
    if (item.pick) {
      out.code = item.pick.code || out.code;
      out.title = item.pick.title || out.title;
      if (typeof item.pick.credits === 'number') out.credits = item.pick.credits;
      var opt = slotOptionByCode[item.pick.code];
      if (opt) {
        out.prereqs = opt.prereqs || [];
        out.standing = opt.standing || null;
        out.requiresConsent = !!opt.requiresConsent;
      }
    }
    out.label = out.code || out.title;
    return out;
  }

  /* --------------------------------------------------------- term sequence */

  function termMeta(index) {
    var base = TERM_ORDER.indexOf(state.startTerm);
    var abs = base + index;
    var term = TERM_ORDER[abs % 3];
    var year = state.startYear + Math.floor(abs / 3) +
               (TERM_OFFSET[term] - TERM_OFFSET[state.startTerm]);
    return {
      term: term,
      year: year,
      label: titleCase(term) + ' ' + year,
      academicYear: Math.floor(abs / 3) + 1
    };
  }

  function capFor(term, cgpa, onProbation) {
    var r = plan.rules.creditLoad;
    if (term === 'summer') return r.summerMax;
    if (onProbation) return r.probationMax;
    if (cgpa != null && cgpa >= r.highGpaThreshold) return r.highGpaMax;
    return r.regularMax;
  }

  /* --------------------------------------------------------------- state */

  function blankItem(ref, termId) {
    return {
      uid: uid(), ref: ref, termId: termId,
      grade: null, done: false, override: false, pick: null, lasCat: null
    };
  }

  // Courses the catalog carries but the official plan does not schedule — the
  // freshman English pair, say — belong in the tray rather than nowhere.
  function addMissingCourses(items) {
    plan.courses.forEach(function (c) {
      var present = items.some(function (i) { return i.ref === c.id; });
      if (!present) items.push(blankItem(c.id, null));
    });
    return items;
  }

  function freshState() {
    var s = {
      planId: PLAN_ID,
      planVersion: plan.plan.planVersion,
      startYear: new Date().getFullYear(),
      startTerm: 'fall',
      entryCredits: plan.entryCredits.default,
      collapsedYears: [],
      terms: [],
      items: []
    };
    plan.template.forEach(function (row) {
      var t = { id: uid(), status: 'planned' };
      s.terms.push(t);
      row.courses.forEach(function (ref) { s.items.push(blankItem(ref, t.id)); });
    });
    addMissingCourses(s.items);
    return s;
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
    if (!raw) return freshState();
    try {
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.terms) || !Array.isArray(s.items)) return freshState();
      s.items = addMissingCourses(
        s.items.filter(function (i) { return courseById[i.ref]; }));
      if (!Array.isArray(s.collapsedYears)) s.collapsedYears = [];
      s.terms.forEach(function (t) {              // boards saved before statuses
        if (!t.status) t.status = t.locked ? 'registered' : 'planned';
        delete t.locked;
      });
      if (s.planVersion !== plan.plan.planVersion) {
        setTimeout(function () {
          toast('A newer study plan is available. Export your work, then use Reset to plan.');
        }, 600);
      }
      return s;
    } catch (e) {
      return freshState();
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast('Could not save. Browser storage may be full or blocked.'); }
  }

  function statusOf(t) {
    if (!t) return 'planned';
    if (t.status && TERM_STATUS[t.status]) return t.status;
    return t.locked ? 'registered' : 'planned';   // boards saved before statuses
  }

  function isFrozen(t) { return !!TERM_STATUS[statusOf(t)].frozen; }

  function termById(termId) {
    var i = termIndexOf(termId);
    return i < 0 ? null : state.terms[i];
  }

  function isCollapsed(year) {
    return (state.collapsedYears || []).indexOf(year) !== -1;
  }

  function toggleYear(year) {
    state.collapsedYears = state.collapsedYears || [];
    var at = state.collapsedYears.indexOf(year);
    if (at === -1) state.collapsedYears.push(year);
    else state.collapsedYears.splice(at, 1);
    render();
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function termIndexOf(termId) {
    for (var i = 0; i < state.terms.length; i++) {
      if (state.terms[i].id === termId) return i;
    }
    return -1;
  }

  function itemsIn(termId) {
    return state.items.filter(function (i) { return i.termId === termId; });
  }

  function findItem(u) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].uid === u) return state.items[i];
    }
    return null;
  }

  /* ------------------------------------------------------- derived status */

  function gradeInfo(item) { return item.grade ? gradeByLetter[item.grade] : null; }

  function isPassed(item) {
    var g = gradeInfo(item);
    if (g) return !!g.passing;
    return !!item.done;
  }

  function isFailed(item) {
    var g = gradeInfo(item);
    return !!(g && !g.passing && g.points === 0) || item.grade === 'NP';
  }

  function isWithdrawn(item) {
    return item.grade === 'WI' || item.grade === 'WP' || item.grade === 'WF';
  }

  // A course counts toward a later course's prerequisites as long as it is
  // placed earlier and was not abandoned.
  function countsAsTaken(item) {
    return !isWithdrawn(item) && !isFailed(item);
  }

  /* -------------------------------------------------------- GPA and credits

     LAU counts only the latest attempt of a repeated course, so attempts are
     grouped by course and the one in the latest term wins. */

  function gpaSets() {
    var latest = {};
    state.items.forEach(function (item) {
      if (item.termId == null) return;
      var g = gradeInfo(item);
      if (!g || !g.inGPA) return;
      var key = identity(item);
      var idx = termIndexOf(item.termId);
      if (!latest[key] || idx > latest[key].idx) latest[key] = { item: item, idx: idx };
    });
    return Object.keys(latest).map(function (k) { return latest[k].item; });
  }

  // The major is an area, not a prefix. CAPP files CIE200 under maths and
  // MEE211 under general engineering, however their codes read.
  function inMajor(eff) {
    return plan.majorGPA.categories.indexOf(eff.category) !== -1;
  }

  function computeGPA(onlyMajor) {
    var pts = 0, cr = 0;
    gpaSets().forEach(function (item) {
      var eff = effective(item);
      if (onlyMajor && !inMajor(eff)) return;
      var g = gradeByLetter[item.grade];
      pts += g.points * eff.credits;
      cr += eff.credits;
    });
    return cr > 0 ? { gpa: pts / cr, credits: cr } : { gpa: null, credits: 0 };
  }

  // Degree credit is awarded once per course however many attempts it took.
  function earnedCredits() {
    var seen = {}, total = 0;
    state.items.forEach(function (item) {
      if (item.termId == null || !isPassed(item)) return;
      var key = identity(item);
      if (seen[key]) return;
      seen[key] = true;
      total += effective(item).credits;
    });
    return total;
  }

  function plannedCredits() {
    var seen = {}, total = 0;
    state.items.forEach(function (item) {
      if (item.termId == null || isWithdrawn(item)) return;
      var key = identity(item);
      if (seen[key]) return;
      seen[key] = true;
      total += effective(item).credits;
    });
    return total;
  }

  function creditsBefore(termIdx) {
    var seen = {}, total = 0;
    state.items.forEach(function (item) {
      if (item.termId == null) return;
      if (termIndexOf(item.termId) >= termIdx) return;
      if (!countsAsTaken(item)) return;
      var key = identity(item);
      if (seen[key]) return;
      seen[key] = true;
      total += effective(item).credits;
    });
    return state.entryCredits + total;
  }

  function termCredits(termId) {
    return itemsIn(termId).reduce(function (sum, i) {
      return sum + (isWithdrawn(i) ? 0 : effective(i).credits);
    }, 0);
  }

  /* --------------------------------------------------------- the validator */

  function analyse() {
    var issues = [];
    var byItem = {};
    var cgpa = computeGPA(false);
    var earned = earnedCredits();
    var onProbation = cgpa.gpa != null &&
                      cgpa.gpa < plan.rules.probation.minCGPA &&
                      cgpa.credits >= plan.rules.probation.minCreditsBeforeProbation;

    function flag(item, kind, severity, text) {
      var eff = effective(item);
      issues.push({ kind: kind, severity: severity, where: eff.label, text: text, uid: item.uid });
      (byItem[item.uid] = byItem[item.uid] || []).push({ kind: kind, severity: severity, text: text });
    }

    // Where is each course satisfied, and when?
    var placedAt = {};
    state.items.forEach(function (item) {
      if (item.termId == null || !countsAsTaken(item)) return;
      var idx = termIndexOf(item.termId);
      var key = identity(item);
      if (placedAt[key] == null || idx < placedAt[key]) placedAt[key] = idx;
    });

    var attempts = {};
    state.items.forEach(function (item) {
      if (item.termId == null) return;
      var key = identity(item);
      attempts[key] = (attempts[key] || 0) + 1;
    });

    state.items.forEach(function (item) {
      if (item.termId == null) return;
      var eff = effective(item);
      var idx = termIndexOf(item.termId);
      var meta = termMeta(idx);

      if (!item.override) {
        // Prerequisites: an AND of OR groups.
        eff.prereqs.forEach(function (group) {
          var ok = group.some(function (code) {
            if (isFreshmanCourse(code)) return true;
            return placedAt[code] != null && placedAt[code] < idx;
          });
          if (!ok) {
            var names = group.map(nameOf).join(' or ');
            var hidden = eff.hiddenPrereq && group.length === 1 &&
                         eff.hiddenPrereq.indexOf(group[0]) === 0;
            flag(item, 'prereq', 'error',
              'Needs ' + names + ' in an earlier term' +
              (hidden ? '. This prerequisite is not drawn on the official flow chart.' : '.'));
          }
        });

        // Corequisites may sit in the same term or earlier.
        eff.coreqs.forEach(function (code) {
          if (placedAt[code] == null || placedAt[code] > idx) {
            flag(item, 'coreq', 'error',
              'Needs ' + nameOf(code) + ' in the same term or earlier.');
          }
        });

        // "Concurrent with" means the same term, nothing looser.
        eff.concurrent.forEach(function (code) {
          var together = itemsIn(item.termId).some(function (o) {
            return effective(o).label === code && countsAsTaken(o);
          });
          if (!together) {
            flag(item, 'coreq', 'error',
              'Must be taken in the same term as ' + nameOf(code) + '.');
          }
        });

        // Class standing.
        if (eff.standing) {
          var need = plan.rules.standing.thresholds[eff.standing];
          var have = creditsBefore(idx);
          if (need != null && have < need) {
            flag(item, 'standing', 'error',
              'Needs ' + eff.standing.replace('-', ' ') + ' standing, about ' + need +
              ' credits. You reach ' + have + ' by ' + meta.label + '.');
          }
        }
      }

      // Offering: the official plan puts this course in a different term type.
      var want = templateTermOf[item.ref];
      if (want && want !== meta.term) {
        flag(item, 'offering', 'warn',
          'The study plan schedules this in ' + titleCase(want) +
          '. Check it is offered in ' + titleCase(meta.term) + '.');
      }

      if (eff.requiresConsent) {
        flag(item, 'consent', 'warn', 'Requires the instructor’s consent.');
      }

      if (attempts[identity(item)] > plan.rules.repeats.maxRegistrations) {
        flag(item, 'repeat', 'error',
          'Registered ' + attempts[identity(item)] + ' times. LAU allows ' +
          plan.rules.repeats.maxRegistrations + '.');
      }
    });

    // Per-term credit limits.
    state.terms.forEach(function (t, idx) {
      var meta = termMeta(idx);
      var cr = termCredits(t.id);
      var cap = capFor(meta.term, cgpa.gpa, onProbation);
      if (cr > cap) {
        issues.push({
          kind: 'load', severity: 'error', where: meta.label,
          text: cr + ' credits exceeds the ' + cap + '-credit limit for this term.',
          uid: null
        });
      }
    });

    return {
      issues: issues,
      byItem: byItem,
      cgpa: cgpa,
      major: computeGPA(true),
      earned: earned,
      planned: plannedCredits(),
      onProbation: onProbation
    };
  }

  /* ------------------------------------------------------------ rendering */

  var analysis = null;

  function render() {
    analysis = analyse();
    renderStats();
    renderBoard();
    renderBank();
    renderIssues();
    renderRequirements();
    save();
    checkFinale();
  }

  function fmtGPA(v) { return v == null ? '—' : v.toFixed(2); }

  // Entry credits are extra coursework the plan itself does not list, so they
  // are added to both sides of the ratio rather than counted against the plan.
  function totalRequired() {
    return plan.plan.requiredCredits +
           (plan.entryCredits.countsTowardCredits ? state.entryCredits : 0);
  }

  function renderStats() {
    setText('statEarned', analysis.earned + state.entryCredits);
    setText('statEarnedSub', 'of ' + totalRequired() + ' required');
    setText('statPlanned', analysis.planned + state.entryCredits);

    setText('statCGPA', fmtGPA(analysis.cgpa.gpa));
    setText('statCGPASub', analysis.cgpa.credits
      ? analysis.cgpa.credits + ' credits graded' : 'no graded courses');

    setText('statMGPA', fmtGPA(analysis.major.gpa));
    setText('statMGPASub', analysis.major.credits
      ? analysis.major.credits + ' credits graded' : 'no graded courses');

    var errors = analysis.issues.filter(function (i) { return i.severity === 'error'; }).length;
    var warns = analysis.issues.length - errors;
    setText('statIssues', errors);
    setText('statIssuesSub', errors === 0 && warns === 0
      ? 'nothing to review' : (warns + ' to check'));

    var flags = $('statbar') && $('statbar').querySelector('.stat-flags');
    if (flags) flags.classList.toggle('has-issues', errors > 0);
  }

  function renderBoard() {
    var board = $('board');
    board.textContent = '';

    // Terms group by academic year so a year can be folded away once it is
    // behind you.
    var groups = [];
    state.terms.forEach(function (t, idx) {
      var meta = termMeta(idx);
      var g = groups[groups.length - 1];
      if (!g || g.year !== meta.academicYear) {
        g = { year: meta.academicYear, rows: [] };
        groups.push(g);
      }
      g.rows.push({ term: t, idx: idx, meta: meta });
    });

    groups.forEach(function (g) {
      board.appendChild(yearHead(g));
      if (isCollapsed(g.year)) return;
      g.rows.forEach(function (r) { board.appendChild(termRow(r.term, r.idx, r.meta)); });
    });
  }

  function yearHead(g) {
    var credits = 0, complete = 0;
    g.rows.forEach(function (r) {
      credits += termCredits(r.term.id);
      if (statusOf(r.term) === 'done') complete += 1;
    });
    var collapsed = isCollapsed(g.year);

    var head = el('button', 'year-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', String(!collapsed));
    if (collapsed) head.classList.add('is-collapsed');
    if (complete === g.rows.length) head.classList.add('is-done');

    head.appendChild(el('span', 'year-caret', collapsed ? '+' : '\u2212'));
    head.appendChild(el('span', 'year-name', 'Year ' + g.year));

    var meta = el('span', 'year-meta');
    meta.appendChild(el('b', null, credits + ' cr'));
    meta.appendChild(document.createTextNode(
      ' \u00b7 ' + g.rows.length + ' term' + (g.rows.length === 1 ? '' : 's')));
    if (complete) {
      meta.appendChild(document.createTextNode(' \u00b7 '));
      meta.appendChild(el('b', 'year-done', complete + ' complete'));
    }
    head.appendChild(meta);
    head.appendChild(el('span', 'year-toggle', collapsed ? 'Show' : 'Hide'));

    head.addEventListener('click', function () { toggleYear(g.year); });
    return head;
  }

  function termRow(t, idx, meta) {
    var cr = termCredits(t.id);
    var cap = capFor(meta.term, analysis.cgpa.gpa, analysis.onProbation);
    var status = statusOf(t);
    var frozen = isFrozen(t);

    var row = el('div', 'term');
    row.dataset.termId = t.id;
    row.dataset.status = status;
    if (cr > cap) row.classList.add('is-over');

    var rail = el('div', 'term-rail');
    rail.appendChild(el('span', 'term-idx', pad2(idx + 1)));
    rail.appendChild(el('span', 'term-name', titleCase(meta.term)));
    rail.appendChild(el('span', 'term-year', meta.year + ' \u00b7 Year ' + meta.academicYear));
    rail.appendChild(el('span', 'term-credits', cr + ' / ' + cap + ' cr'));

    var meter = el('div', 'term-meter');
    var meterFill = el('span');
    meterFill.style.width = Math.min(100, cap ? (cr / cap) * 100 : 0) + '%';
    meter.appendChild(meterFill);
    rail.appendChild(meter);

    var ctrl = el('div', 'term-status');
    ['registered', 'active', 'done'].forEach(function (key) {
      var b = el('button', 'tbtn tbtn-' + key, TERM_STATUS[key].button);
      b.type = 'button';
      b.title = 'Mark this term ' + TERM_STATUS[key].label.toLowerCase();
      b.setAttribute('aria-pressed', String(status === key));
      if (status === key) b.classList.add('is-on');
      b.addEventListener('click', function () {
        var was = statusOf(t);
        t.status = was === key ? 'planned' : key;
        render();
        if (t.status === 'done' && was !== 'done') celebrate(meta, cr);
      });
      ctrl.appendChild(b);
    });
    rail.appendChild(ctrl);

    if (itemsIn(t.id).length === 0 && state.terms.length > 1) {
      var del = el('button', 'term-del', 'Remove term');
      del.type = 'button';
      del.addEventListener('click', function () {
        state.terms.splice(idx, 1);
        render();
      });
      rail.appendChild(del);
    }
    row.appendChild(rail);

    var slots = el('div', 'slots');
    slots.dataset.termId = t.id;
    itemsIn(t.id).forEach(function (item) { slots.appendChild(cardFor(item, frozen)); });
    attachDrop(slots, t.id, frozen);
    row.appendChild(slots);

    return row;
  }

  function renderBank() {
    var bank = $('bank');
    bank.textContent = '';
    var loose = state.items.filter(function (i) { return i.termId == null; });
    loose.forEach(function (item) { bank.appendChild(cardFor(item, false)); });
    attachDrop(bank, null, false);
    setText('trayCount', loose.length);
  }

  function cardFor(item, frozen) {
    var eff = effective(item);
    var flags = analysis.byItem[item.uid] || [];
    var hasError = flags.some(function (f) { return f.severity === 'error'; });
    var hasWarn = flags.some(function (f) { return f.kind === 'offering'; });

    var card = el('button', 'card');
    card.type = 'button';
    card.dataset.uid = item.uid;
    card.dataset.cat = eff.category;
    card.draggable = !frozen;
    if (frozen) card.classList.add('is-pinned');

    if (isPassed(item)) card.classList.add('is-done');
    if (isFailed(item)) card.classList.add('is-failed');
    if (isWithdrawn(item)) card.classList.add('is-withdrawn');
    if (hasError && !item.override) card.classList.add('is-flagged');
    if (hasWarn) card.classList.add('is-stale');

    card.appendChild(el('span', 'card-code', eff.label));
    card.appendChild(el('span', 'card-title', eff.code ? eff.title : ''));

    var foot = el('div', 'card-foot');
    foot.appendChild(el('span', 'card-cr', eff.credits + ' cr'));

    var marks = el('div', 'card-marks');
    if (eff.prereqs.length) marks.appendChild(el('span', 'mark', 'P'));
    if (eff.coreqs.length || eff.concurrent.length) marks.appendChild(el('span', 'mark', 'C'));
    if (eff.hiddenPrereq) marks.appendChild(el('span', 'mark mark-h', 'H'));
    if (item.override) marks.appendChild(el('span', 'mark mark-x', '!'));
    foot.appendChild(marks);
    card.appendChild(foot);

    if (item.grade) {
      card.appendChild(el('span', 'card-grade', item.grade));
      card.classList.add('has-grade');
    }

    // A withdrawal is easy to miss as a tint, and it changes what you still
    // owe, so it gets said in words.
    if (isWithdrawn(item)) {
      var g = gradeByLetter[item.grade];
      card.appendChild(el('span', 'card-ribbon',
        'Withdrawn \u00b7 ' + ((g && g.label) || item.grade)));
    }

    var bits = [eff.label, eff.title, eff.credits + ' credits'];
    flags.forEach(function (f) { bits.push(f.text); });
    card.title = bits.join(' \u2014 ');

    card.addEventListener('click', function () {
      if (!dragging) openSheet(item.uid);
    });
    card.addEventListener('dragstart', function (ev) {
      if (frozen) {
        ev.preventDefault();
        return;
      }
      dragging = item.uid;
      ev.dataTransfer.setData('text/plain', item.uid);
      ev.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
      document.body.classList.add('is-dragging');
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      clearGhost();
      setTimeout(function () { dragging = null; }, 0);
    });

    return card;
  }

  /* ----------------------------------------------------------- drag and drop

     The ghost is a real element parked in the grid where the card would land,
     so the layout shows the result before the drop rather than after it. It is
     also what makes reordering inside one term work: the drop target is a
     position, not a container. */

  var dragging = null;
  var ghostEl = null;

  function ghost() {
    if (!ghostEl) ghostEl = el('div', 'drop-ghost');
    return ghostEl;
  }

  function clearGhost() {
    if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
    [].forEach.call(document.querySelectorAll('.drag-over'), function (n) {
      n.classList.remove('drag-over');
    });
  }

  // Nearest card to the pointer picks the slot; which side of its centre the
  // pointer is on picks before or after.
  function placeGhost(node, x, y) {
    var g = ghost();
    if (g.parentNode) g.parentNode.removeChild(g);

    var cards = [].filter.call(node.querySelectorAll('.card'), function (c) {
      return !c.classList.contains('dragging');
    });
    if (!cards.length) { node.appendChild(g); return; }

    var best = null, bestDist = Infinity;
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var d = Math.abs(y - cy) * 2 + Math.abs(x - cx);   // same row wins first
      if (d < bestDist) { bestDist = d; best = { el: c, after: x > cx }; }
    });

    if (best.after) node.insertBefore(g, best.el.nextSibling);
    else node.insertBefore(g, best.el);
  }

  // Move an item into a term, landing just before beforeUid when one is given.
  function placeItem(item, termId, beforeUid) {
    var from = state.items.indexOf(item);
    if (from > -1) state.items.splice(from, 1);
    item.termId = termId;

    if (beforeUid) {
      for (var i = 0; i < state.items.length; i++) {
        if (state.items[i].uid === beforeUid) { state.items.splice(i, 0, item); return; }
      }
    }
    var last = -1;
    state.items.forEach(function (it, n) { if (it.termId === termId) last = n; });
    state.items.splice(last + 1, 0, item);
  }

  function attachDrop(node, termId, frozen) {
    node.addEventListener('dragover', function (ev) {
      if (!dragging) return;
      ev.preventDefault();
      if (frozen) { ev.dataTransfer.dropEffect = 'none'; return; }
      ev.dataTransfer.dropEffect = 'move';
      node.classList.add('drag-over');
      placeGhost(node, ev.clientX, ev.clientY);
    });

    node.addEventListener('dragleave', function (ev) {
      // without this the highlight strobes on every child boundary
      if (ev.relatedTarget && node.contains(ev.relatedTarget)) return;
      node.classList.remove('drag-over');
    });

    node.addEventListener('drop', function (ev) {
      ev.preventDefault();
      if (frozen) {
        clearGhost();
        toast('That term is ' + TERM_STATUS[statusOf(termById(termId))].label.toLowerCase() +
              '. Set it back to Plan to make changes.');
        return;
      }
      var item = findItem(ev.dataTransfer.getData('text/plain') || dragging);
      if (!item) { clearGhost(); return; }

      var g = ghost();
      var next = g.parentNode ? g.nextElementSibling : null;
      var beforeUid = next && next.classList.contains('card') ? next.dataset.uid : null;
      clearGhost();

      placeItem(item, termId, beforeUid);
      render();
    });
  }

  /* ---------------------------------------------------------------- finale

     Every requirement area satisfied is the whole degree done, which deserves
     more than a term's worth of confetti. */

  function degreeComplete() {
    var areas = plan.areas || [];
    if (!areas.length) return false;
    return areas.every(function (a) { return areaCredits(a).earned >= a.credits; });
  }

  // Runs after save(), so the flag has to write itself or the finale fires
  // again on every reload.
  function checkFinale() {
    if (degreeComplete()) {
      if (!state.degreeCelebrated) {
        state.degreeCelebrated = true;
        save();
        fireworks();
      }
    } else if (state.degreeCelebrated) {
      state.degreeCelebrated = false;   // undo a course and it can fire again
      save();
    }
  }

  function fireworks() {
    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var wrap = el('div', 'finale');
    var canvas = document.createElement('canvas');
    wrap.appendChild(canvas);

    var panel = el('div', 'finale-panel');
    panel.appendChild(el('span', 'finale-kicker', 'Every requirement met'));
    panel.appendChild(el('strong', 'finale-title', 'Degree complete'));
    panel.appendChild(el('span', 'finale-line',
      (analysis.earned + state.entryCredits) + ' credits \u00b7 ' + plan.plan.program));
    panel.appendChild(el('span', 'finale-dismiss', 'Click anywhere to dismiss'));
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    var stop = false;
    function close() {
      if (stop) return;
      stop = true;
      wrap.classList.add('is-out');
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }, 500);
    }
    wrap.addEventListener('click', close);
    setTimeout(close, reduced ? 2600 : 9000);
    if (reduced) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    var COLOURS = ['#ff3b21', '#ffe400', '#2b44ff', '#00d563', '#ff2d87', '#ff9500'];
    var sparks = [];

    function burst(x, y) {
      var colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      var count = 46 + Math.floor(Math.random() * 26);
      for (var i = 0; i < count; i++) {
        var ang = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        var speed = 1.8 + Math.random() * 3.6;
        sparks.push({
          x: x, y: y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          colour: colour,
          size: 1.6 + Math.random() * 2.2
        });
      }
    }

    var next = 0;
    var started = Date.now();
    function frame() {
      if (stop) {
        window.removeEventListener('resize', size);
        return;
      }
      var now = Date.now();
      if (now > next && now - started < 7000) {
        burst(window.innerWidth * (0.15 + Math.random() * 0.7),
              window.innerHeight * (0.12 + Math.random() * 0.45));
        next = now + 320 + Math.random() * 420;
      }

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'source-over';

      for (var i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i];
        s.vy += 0.045;              // gravity
        s.vx *= 0.992;
        s.vy *= 0.992;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.colour;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    burst(window.innerWidth / 2, window.innerHeight * 0.34);
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ celebration */

  function celebrate(meta, credits) {
    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // marking two terms done in quick succession should not stack overlays
    [].forEach.call(document.querySelectorAll('.cheer'), function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });

    var done = state.terms.filter(function (t) { return statusOf(t) === 'done'; }).length;
    var wrap = el('div', 'cheer');

    var panel = el('div', 'cheer-panel');
    panel.appendChild(el('span', 'cheer-kicker', 'Term complete'));
    panel.appendChild(el('strong', 'cheer-term', meta.label));
    panel.appendChild(el('span', 'cheer-line',
      credits + ' credits banked \u00b7 ' + done +
      ' term' + (done === 1 ? '' : 's') + ' done'));
    wrap.appendChild(panel);

    if (!reduced) {
      var colours = ['#ff3b21', '#ffe400', '#2b44ff', '#00d563', '#0c0c0c'];
      for (var i = 0; i < 42; i++) {
        var bit = el('i', 'cheer-bit');
        bit.style.left = (Math.random() * 100).toFixed(1) + '%';
        bit.style.background = colours[i % colours.length];
        bit.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
        bit.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + 's';
        bit.style.width = (6 + Math.round(Math.random() * 8)) + 'px';
        wrap.appendChild(bit);
      }
    }

    document.body.appendChild(wrap);
    setTimeout(function () {
      wrap.classList.add('is-out');
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }, 400);
    }, reduced ? 1300 : 2300);
  }

  // Offering warnings are better placed on the card that caused them, where
  // you are already looking, than as rows filling this list.
  var ISSUES_NOT_LISTED = ['offering'];

  function renderIssues() {
    var list = $('issues');
    list.textContent = '';
    var sorted = analysis.issues.filter(function (i) {
      return ISSUES_NOT_LISTED.indexOf(i.kind) === -1;
    }).sort(function (a, b) {
      if (a.severity === b.severity) return 0;
      return a.severity === 'error' ? -1 : 1;
    });
    sorted.forEach(function (iss) {
      var li = el('li', 'issue');
      var kind = el('span', 'issue-kind' + (iss.severity === 'error' ? '' : ' soft'), iss.kind);
      li.appendChild(kind);
      var body = el('div');
      body.appendChild(el('span', 'issue-where', iss.where));
      body.appendChild(document.createTextNode(' '));
      body.appendChild(el('span', 'issue-text', iss.text));
      li.appendChild(body);
      if (iss.uid) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () { openSheet(iss.uid); });
      }
      list.appendChild(li);
    });
  }

  // Credits sitting in one requirement area, each course counted once.
  function areaCredits(area) {
    if (area.entryCredits) {
      return { earned: state.entryCredits, planned: state.entryCredits };
    }
    var seen = {}, earned = 0, planned = 0;
    state.items.forEach(function (item) {
      if (item.termId == null) return;
      var eff = effective(item);
      if (area.categories.indexOf(eff.category) === -1) return;
      var key = identity(item);
      if (seen[key]) return;
      seen[key] = true;
      if (!isWithdrawn(item)) planned += eff.credits;
      if (isPassed(item)) earned += eff.credits;
    });
    return { earned: earned, planned: planned };
  }

  function renderRequirements() {
    var host = $('requirements');
    host.textContent = '';

    function bar(name, have, need, detail, overable) {
      var d = el('div', 'req');
      if (have >= need) d.classList.add('is-met');
      if (overable && have > need) d.classList.add('is-over');
      var top = el('div', 'req-top');
      top.appendChild(el('span', 'req-name', name));
      top.appendChild(el('span', 'req-count', have + ' / ' + need));
      d.appendChild(top);
      var b = el('div', 'req-bar');
      var fill = el('span');
      fill.style.width = Math.min(100, need ? (have / need) * 100 : 0) + '%';
      b.appendChild(fill);
      d.appendChild(b);
      if (detail) d.appendChild(el('p', 'req-detail', detail));
      host.appendChild(d);
    }

    // One row per CAPP requirement area, read in earned credits the way the
    // degree evaluation reads them.
    host.appendChild(el('h3', 'req-head', 'Requirement areas'));
    (plan.areas || []).forEach(function (area) {
      var got = areaCredits(area);
      bar(area.label, got.earned, area.credits,
          area.entryCredits ? 'transfer credits, no grade points'
                            : got.planned + ' credits placed',
          false);
    });

    // LAS categories.
    host.appendChild(el('h3', 'req-head', 'LAS Curriculum Z detail'));
    var las = plan.slotOptions.las;
    var counts = {};
    var unassigned = 0;
    state.items.forEach(function (item) {
      var base = courseById[item.ref];
      if (!base || base.slot !== 'las' || item.termId == null) return;
      if (item.lasCat) counts[item.lasCat] = (counts[item.lasCat] || 0) + 1;
      else unassigned += 1;
    });
    las.requirements.forEach(function (r) {
      bar('LAS — ' + r.label, counts[r.id] || 0, r.count,
          r.credits + ' credits', true);
    });
    if (unassigned) {
      host.appendChild(el('p', 'req-detail',
        unassigned + ' LAS slot' + (unassigned > 1 ? 's have' : ' has') +
        ' no category assigned yet.'));
    }

    // Slots that need a specific course chosen.
    host.appendChild(el('h3', 'req-head', 'Still to choose'));
    [['technical', 'Technical electives'], ['restricted', 'SDG restricted elective'],
     ['soe', 'SOE signature'], ['science', 'Science elective']
    ].forEach(function (pair) {
      var key = pair[0];
      var cfg = plan.slotOptions[key];
      var total = 0, chosen = 0, credits = 0;
      state.items.forEach(function (item) {
        var base = courseById[item.ref];
        if (!base || base.slot !== key || item.termId == null) return;
        total += 1;
        if (item.pick) { chosen += 1; credits += effective(item).credits; }
      });
      if (!total) return;
      // VIP+ courses come in 1, 2 and 3 credit sizes and stack, so the
      // signature requirement is measured in credits rather than courses.
      if (cfg.creditsRequired) {
        bar(pair[1], credits, cfg.creditsRequired, 'credits chosen', false);
      } else {
        bar(pair[1], chosen, total, 'courses chosen', false);
      }
    });

    host.appendChild(el('h3', 'req-head', 'Degree total'));
    bar('Total credits', analysis.earned + state.entryCredits,
        totalRequired(), 'earned, including Baccalaureate credits', false);
  }

  /* ---------------------------------------------------------- detail sheet */

  var sheetUid = null;

  function openSheet(u) {
    sheetUid = u;
    var item = findItem(u);
    if (!item) return;
    var eff = effective(item);
    var body = $('sheetBody');
    body.textContent = '';

    body.appendChild(el('h3', null, eff.label));

    var tag = el('span', 'cat-tag', plan.categories[eff.category].label);
    tag.dataset.cat = eff.category;
    body.appendChild(tag);

    body.appendChild(el('p', 'sheet-sub',
      (eff.code ? eff.title + ' · ' : '') +
      eff.credits + ' credit' + (eff.credits === 1 ? '' : 's')));

    if (eff.hiddenPrereq) {
      body.appendChild(el('div', 'sheet-note', eff.hiddenPrereq));
    }

    var flags = analysis.byItem[u] || [];
    flags.forEach(function (f) {
      body.appendChild(el('div', 'sheet-note' + (f.severity === 'error' ? '' : ' quiet'), f.text));
    });

    // Requirements, with what satisfies them.
    if (eff.prereqs.length || eff.coreqs.length || eff.concurrent.length || eff.standing) {
      var sec = el('div', 'sheet-section');
      sec.appendChild(el('h4', null, 'Requirements'));
      var dl = el('dl');
      eff.prereqs.forEach(function (g) {
        dl.appendChild(el('dt', null, 'Prerequisite'));
        dl.appendChild(el('dd', null, g.map(nameOf).join(' or ')));
      });
      eff.coreqs.forEach(function (c) {
        dl.appendChild(el('dt', null, 'Corequisite'));
        dl.appendChild(el('dd', null, nameOf(c)));
      });
      eff.concurrent.forEach(function (c) {
        dl.appendChild(el('dt', null, 'Concurrent with'));
        dl.appendChild(el('dd', null, nameOf(c)));
      });
      if (eff.standing) {
        dl.appendChild(el('dt', null, 'Class standing'));
        dl.appendChild(el('dd', null, titleCase(eff.standing.replace('-', ' ')) +
          ' (about ' + plan.rules.standing.thresholds[eff.standing] + ' credits)'));
      }
      sec.appendChild(dl);
      body.appendChild(sec);
    }

    // Slot picker.
    if (eff.slot) buildSlotPicker(body, item, eff);

    // Grades.
    var gsec = el('div', 'sheet-section');
    gsec.appendChild(el('h4', null, 'Grade'));
    var grid = el('div', 'grade-grid');
    plan.grades.forEach(function (g) {
      var b = el('button', 'grade-btn', g.letter);
      b.type = 'button';
      if (item.grade === g.letter) {
        b.classList.add('is-on');
        if (!g.passing) b.classList.add('is-bad');
      }
      b.title = g.label || (g.points != null ? g.points.toFixed(2) + ' quality points' : '');
      b.addEventListener('click', function () {
        item.grade = item.grade === g.letter ? null : g.letter;
        if (item.grade) item.done = false;
        render();
        openSheet(u);
      });
      grid.appendChild(b);
    });
    gsec.appendChild(grid);

    var check = el('label', 'check');
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!item.done;
    cb.addEventListener('change', function () {
      item.done = cb.checked;
      if (item.done) item.grade = null;
      render();
      openSheet(u);
    });
    check.appendChild(cb);
    check.appendChild(document.createTextNode('Completed, grade not recorded'));
    gsec.appendChild(check);
    body.appendChild(gsec);

    // Placement.
    var psec = el('div', 'sheet-section');
    psec.appendChild(el('h4', null, 'Placement'));
    var sel = document.createElement('select');
    var optBank = document.createElement('option');
    optBank.value = '';
    optBank.textContent = 'Unplaced';
    sel.appendChild(optBank);
    state.terms.forEach(function (t, i) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = termMeta(i).label +
        (isFrozen(t) ? ' (' + TERM_STATUS[statusOf(t)].label.toLowerCase() + ')' : '');
      sel.appendChild(o);
    });
    sel.value = item.termId || '';
    sel.addEventListener('change', function () {
      item.termId = sel.value || null;
      render();
      openSheet(u);
    });
    psec.appendChild(sel);

    var ov = el('label', 'check');
    var ovcb = document.createElement('input');
    ovcb.type = 'checkbox';
    ovcb.checked = !!item.override;
    ovcb.addEventListener('change', function () {
      item.override = ovcb.checked;
      render();
      openSheet(u);
    });
    ov.appendChild(ovcb);
    ov.appendChild(document.createTextNode('Override checks (advisor approved)'));
    psec.appendChild(ov);

    var row = el('div', 'sheet-row');
    var isSlot = !!eff.slot;
    var dup = el('button', 'btn',
      isSlot ? 'Add another ' + plan.slotOptions[eff.slot].label : 'Add retake');
    dup.type = 'button';
    dup.addEventListener('click', function () {
      var copy = blankItem(item.ref, null);
      if (!isSlot) {
        copy.pick = item.pick ? JSON.parse(JSON.stringify(item.pick)) : null;
        copy.lasCat = item.lasCat;
      }
      state.items.push(copy);
      render();
      toast(isSlot
        ? 'Empty slot added to unplaced courses.'
        : 'Retake added to unplaced courses.');
      closeSheet();
    });
    row.appendChild(dup);
    psec.appendChild(row);
    body.appendChild(psec);

    $('sheet').hidden = false;
  }

  function buildSlotPicker(body, item, eff) {
    var cfg = plan.slotOptions[eff.slot];
    var sec = el('div', 'sheet-section');
    sec.appendChild(el('h4', null, cfg.label));
    if (cfg.note) sec.appendChild(el('div', 'sheet-note quiet', cfg.note));

    if (cfg.options && cfg.options.length) {
      var sel = document.createElement('select');
      var none = document.createElement('option');
      none.value = '';
      none.textContent = 'Not chosen';
      sel.appendChild(none);
      cfg.options.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.code;
        opt.textContent = o.code + ' — ' + o.title + ' (' + o.credits + ' cr)';
        sel.appendChild(opt);
      });
      sel.value = (item.pick && item.pick.code) || '';
      sel.addEventListener('change', function () {
        var o = slotOptionByCode[sel.value];
        item.pick = o ? { code: o.code, title: o.title, credits: o.credits } : null;
        render();
        openSheet(item.uid);
      });
      sec.appendChild(sel);
    }

    if (cfg.freeText) {
      var note = el('p', 'req-detail',
        cfg.options && cfg.options.length
          ? 'Or type a course not listed above.'
          : 'Type the course you are taking.');
      sec.appendChild(note);

      var code = document.createElement('input');
      code.type = 'text';
      code.placeholder = 'Code, e.g. LAS231';
      code.value = (item.pick && item.pick.code) || '';
      var title = document.createElement('input');
      title.type = 'text';
      title.placeholder = 'Title';
      title.value = (item.pick && item.pick.title) || '';
      var cr = document.createElement('input');
      cr.type = 'number';
      cr.min = '0';
      cr.max = '9';
      cr.value = (item.pick && item.pick.credits) || eff.credits;

      function commit() {
        var c = code.value.trim().toUpperCase();
        if (!c && !title.value.trim()) { item.pick = null; }
        else {
          item.pick = {
            code: c || null,
            title: title.value.trim() || cfg.label,
            credits: Math.max(0, parseInt(cr.value, 10) || 0)
          };
        }
        render();
      }
      [code, title, cr].forEach(function (inp) { inp.addEventListener('change', commit); });

      sec.appendChild(code);
      sec.appendChild(title);
      sec.appendChild(cr);
    }

    if (eff.slot === 'las') {
      var lsel = document.createElement('select');
      var ln = document.createElement('option');
      ln.value = '';
      ln.textContent = 'Category not assigned';
      lsel.appendChild(ln);
      cfg.requirements.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.id;
        o.textContent = r.label;
        lsel.appendChild(o);
      });
      lsel.value = item.lasCat || '';
      lsel.addEventListener('change', function () {
        item.lasCat = lsel.value || null;
        render();
      });
      sec.appendChild(el('p', 'req-detail', 'Which LAS requirement does this satisfy?'));
      sec.appendChild(lsel);
    }

    body.appendChild(sec);
  }

  function closeSheet() {
    $('sheet').hidden = true;
    sheetUid = null;
  }

  /* ---------------------------------------------------------------- legend */

  function renderLegend() {
    var host = $('legendCategories');
    host.textContent = '';
    Object.keys(plan.categories).forEach(function (key) {
      var li = el('li');
      var sw = el('span', 'swatch');
      sw.style.background = getComputedStyle(document.documentElement)
        .getPropertyValue('--cat-' + key);
      li.appendChild(sw);
      li.appendChild(document.createTextNode(plan.categories[key].label));
      host.appendChild(li);
    });
  }

  /* ----------------------------------------------------------------- chrome */

  function wire() {
    $('programName').textContent = plan.plan.program;
    $('effectiveLabel').textContent = 'Effective ' + plan.plan.effective;
    document.title = plan.plan.program + ' — LAU Course Map';

    // Masthead figures come from the plan so another program drops straight in.
    setText('heroCredits', plan.plan.requiredCredits);
    setText('heroCourses', plan.courses.length);
    setText('heroTerms', plan.template.length);
    setText('footerPlan', plan.plan.program + ' · Effective ' + plan.plan.effective);

    $('startTerm').value = state.startTerm;
    $('startYear').value = state.startYear;
    $('entryCredits').value = state.entryCredits;

    $('startTerm').addEventListener('change', function () {
      state.startTerm = this.value;
      render();
    });
    $('startYear').addEventListener('change', function () {
      state.startYear = parseInt(this.value, 10) || new Date().getFullYear();
      render();
    });
    $('entryCredits').addEventListener('change', function () {
      state.entryCredits = Math.max(0, parseInt(this.value, 10) || 0);
      render();
    });

    $('btnAddTerm').addEventListener('click', function () {
      state.terms.push({ id: uid(), locked: false });
      render();
    });

    $('btnExport').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'lau-course-map-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });

    $('btnImport').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var next = JSON.parse(reader.result);
          if (!next || !Array.isArray(next.terms) || !Array.isArray(next.items)) {
            throw new Error('shape');
          }
          state = next;
          state.items = state.items.filter(function (i) { return courseById[i.ref]; });
          $('startTerm').value = state.startTerm;
          $('startYear').value = state.startYear;
          $('entryCredits').value = state.entryCredits;
          render();
          toast('Plan imported.');
        } catch (e) {
          toast('That file is not a saved course map.');
        }
      };
      reader.readAsText(file);
      this.value = '';
    });

    $('btnReset').addEventListener('click', function () {
      if (!window.confirm('Reset the board to the official study plan? Grades and changes will be lost.')) return;
      state = freshState();
      $('startTerm').value = state.startTerm;
      $('startYear').value = state.startYear;
      $('entryCredits').value = state.entryCredits;
      render();
      toast('Reset to the official study plan.');
    });

    var tray = $('tray'), scrim = $('trayScrim'), toggle = $('trayToggle');

    function setTray(open) {
      document.body.classList.toggle('tray-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      scrim.hidden = !open;
      try { localStorage.setItem(STORE_KEY + ':tray', open ? '1' : '0'); } catch (e) {}
    }

    var wide = window.matchMedia('(min-width: 1280px)').matches;
    var remembered;
    try { remembered = localStorage.getItem(STORE_KEY + ':tray'); } catch (e) {}
    setTray(remembered == null ? wide : remembered === '1');

    toggle.addEventListener('click', function () {
      setTray(!document.body.classList.contains('tray-open'));
    });
    $('trayClose').addEventListener('click', function () { setTray(false); });
    scrim.addEventListener('click', function () { setTray(false); });

    $('sheetClose').addEventListener('click', closeSheet);
    $('sheet').addEventListener('click', function (ev) {
      if (ev.target === $('sheet')) closeSheet();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !$('sheet').hidden) closeSheet();
    });
  }

  /* ------------------------------------------------------------------ boot */

  if (!plan) {
    document.body.innerHTML =
      '<p style="padding:40px;font-family:sans-serif">Course data failed to load.</p>';
    return;
  }

  state = load();
  wire();
  renderLegend();
  render();
})();
