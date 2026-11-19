// LAU Mechanical Engineering study plan, effective Fall 2026.
//
// Plain data, written as JavaScript rather than JSON so the page works when
// opened directly from disk; browsers refuse fetch() on file:// URLs.
// Everything below the assignment is valid JSON.
//
// To add another program, copy this file, change the plan id, and add a
// matching <script> tag to index.html.

window.PLANS = window.PLANS || {};
window.PLANS['lau-mee-2026f'] = {
  "plan": {
    "id": "lau-mee-2026f",
    "program": "Mechanical Engineering",
    "degree": "Bachelor of Engineering",
    "school": "School of Engineering",
    "university": "Lebanese American University",
    "catalog": "2026-2027",
    "effective": "Fall 2026",
    "planVersion": 1,
    "requiredCredits": 156,
    "note": "156 credits of coursework (150 scheduled by the plan plus ENG101 and ENG102), on top of 24 Baccalaureate credits, for the 180 the degree requires. A 4-credit science elective adds one."
  },

  "entryCredits": {
    "label": "Baccalaureate",
    "default": 24,
    "editable": true,
    "countsTowardCredits": true,
    "countsTowardGPA": false,
    "note": "The CAPP Baccalaureate area: 24 transfer credits carried by a Lebanese, French or International Baccalaureate or equivalent. They are graded T and excluded from the GPA. ENG101 and ENG102 are not part of this; they are real graded courses."
  },

  "categories": {
    "mee-major":    { "label": "Mechanical Engineering Major", "short": "MEE Major" },
    "tech-elective":{ "label": "Technical and Restricted Electives", "short": "Tech Electives" },
    "math-sci":     { "label": "Mathematics and Science", "short": "Math & Science" },
    "gen-eng":      { "label": "General Engineering", "short": "Gen. Engineering" },
    "las-core":     { "label": "LAS Curriculum Z Core", "short": "LAS Core" },
    "las-elective": { "label": "LAS Elective, Curriculum Z", "short": "LAS Elective" },
    "basic-eng":    { "label": "Basic English", "short": "Basic English" }
  },

  "grades": [
    { "letter": "A",  "points": 4.00, "passing": true,  "inGPA": true },
    { "letter": "A-", "points": 3.67, "passing": true,  "inGPA": true },
    { "letter": "B+", "points": 3.33, "passing": true,  "inGPA": true },
    { "letter": "B",  "points": 3.00, "passing": true,  "inGPA": true },
    { "letter": "B-", "points": 2.67, "passing": true,  "inGPA": true },
    { "letter": "C+", "points": 2.33, "passing": true,  "inGPA": true },
    { "letter": "C",  "points": 2.00, "passing": true,  "inGPA": true },
    { "letter": "C-", "points": 1.67, "passing": true,  "inGPA": true },
    { "letter": "D+", "points": 1.33, "passing": true,  "inGPA": true },
    { "letter": "D",  "points": 1.00, "passing": true,  "inGPA": true },
    { "letter": "F",  "points": 0.00, "passing": false, "inGPA": true },
    { "letter": "P",  "points": null, "passing": true,  "inGPA": false, "label": "Pass" },
    { "letter": "NP", "points": null, "passing": false, "inGPA": false, "label": "No Pass" },
    { "letter": "I",  "points": null, "passing": false, "inGPA": false, "label": "Incomplete" },
    { "letter": "U",  "points": null, "passing": false, "inGPA": false, "label": "Audit" },
    { "letter": "WI", "points": null, "passing": false, "inGPA": false, "label": "Early withdrawal", "countsAsRepeat": false },
    { "letter": "WP", "points": null, "passing": false, "inGPA": false, "label": "Withdrawal pass",  "countsAsRepeat": false },
    { "letter": "WF", "points": null, "passing": false, "inGPA": false, "label": "Withdrawal fail",  "countsAsRepeat": true }
  ],

  "rules": {
    "creditLoad": {
      "regularMax": 18,
      "summerMax": 9,
      "highGpaMax": 21,
      "highGpaThreshold": 3.00,
      "probationMax": 13,
      "probationThreshold": 2.00,
      "minFullTime": 12
    },
    "repeats": {
      "maxRegistrations": 3,
      "latestGradeCounts": true,
      "noRepeatAbove": "B-",
      "wfCountsAsRepeat": true
    },
    "standing": {
      "note": "LAU states class standing in course prerequisites but publishes the credit thresholds separately. These defaults are an approximation and should be confirmed with the department.",
      "approximate": true,
      "thresholds": {
        "second-year": 30,
        "third-year": 60,
        "fourth-year": 90,
        "fifth-year": 120
      }
    },
    "probation": {
      "minCGPA": 2.00,
      "minCreditsBeforeProbation": 20,
      "departmentalMinMajorGPA": 2.00,
      "departmentalAfterCredits": 12
    },
    "honors": [
      { "label": "Honors",           "min": 3.20, "max": 3.49 },
      { "label": "Distinction",      "min": 3.50, "max": 3.79 },
      { "label": "High Distinction", "min": 3.80, "max": 4.00 }
    ]
  },

  "majorGPA": {
    "note": "The major is the CAPP 'Mechanical Eng. Major Req.' area: the MEE course list plus the technical electives, 88 credits. CIE200, the GNE and MTH courses, COE212, ELE305, INE320, INE428 and MEE211 sit in other areas and do not count.",
    "categories": ["mee-major", "tech-elective"],
    "source": "LAU CAPP degree evaluation",
    "capp": "CAPP leaves failed required courses out of its major GPA until the major is complete. This tool counts them, which is what the academic rules say, so the two can differ while courses are outstanding."
  },

  "areas": [
    { "id": "major",    "label": "Mechanical Eng. Major",      "credits": 88,
      "categories": ["mee-major", "tech-elective"] },
    { "id": "mathsci",  "label": "Math and Science",           "credits": 21,
      "categories": ["math-sci"] },
    { "id": "geneng",   "label": "General Engineering",        "credits": 23,
      "categories": ["gen-eng"] },
    { "id": "lascore",  "label": "LASCZ Core",                 "credits": 6,
      "categories": ["las-core"] },
    { "id": "laselec",  "label": "LAS Elective, Curriculum Z", "credits": 12,
      "categories": ["las-elective"] },
    { "id": "basiceng", "label": "Basic English",              "credits": 6,
      "categories": ["basic-eng"] },
    { "id": "bacc",     "label": "Baccalaureate",              "credits": 24,
      "entryCredits": true }
  ],

  "terms": ["fall", "spring", "summer"],

  "externalCourses": {
    "note": "Referenced by prerequisites but not part of this plan. Freshman-level courses are assumed satisfied for students entering with advanced standing.",
    "MTH102": { "title": "Calculus II", "credits": 3, "freshman": true },
    "PHY111": { "title": "Mechanics", "credits": 3, "freshman": true },
    "CIE320": { "title": "Fluid Mechanics (Civil)", "credits": 3, "freshman": false },
    "ELE401": { "title": "Electronics I", "credits": 3, "freshman": false },
    "INE212": { "title": "Computer Applications in INE", "credits": 2, "freshman": false }
  },

  "courses": [
    { "id": "CIE200", "code": "CIE200", "title": "Statics", "credits": 3, "category": "math-sci",
      "prereqs": [], "freshmanPrereqs": ["MTH102", "PHY111"] },
    { "id": "MEE211", "code": "MEE211", "title": "Engineering Graphics", "credits": 1, "category": "gen-eng", "prereqs": [] },
    { "id": "COE212", "code": "COE212", "title": "Engineering Programming", "credits": 3, "category": "gen-eng", "prereqs": [] },
    { "id": "ENG101", "code": "ENG101", "title": "Academic English I", "credits": 3, "category": "basic-eng",
      "prereqs": [], "freshman": true },
    { "id": "ENG102", "code": "ENG102", "title": "Academic English II", "credits": 3, "category": "basic-eng",
      "prereqs": [], "freshman": true },
    { "id": "ENG202", "code": "ENG202", "title": "Advanced Academic English", "credits": 3, "category": "las-core", "prereqs": [] },
    { "id": "MTH201", "code": "MTH201", "title": "Calculus III", "credits": 3, "category": "math-sci",
      "prereqs": [], "freshmanPrereqs": ["MTH102"] },
    { "id": "MTH206", "code": "MTH206", "title": "Calculus IV", "credits": 3, "category": "math-sci", "prereqs": [["MTH201"]] },
    { "id": "MTH304", "code": "MTH304", "title": "Differential Equations", "credits": 3, "category": "math-sci", "prereqs": [["MTH201"]] },
    { "id": "ELE305", "code": "ELE305", "title": "Introduction to Electrical Engineering", "credits": 3, "category": "gen-eng", "prereqs": [] },
    { "id": "MEE241", "code": "MEE241", "title": "Dynamics", "credits": 3, "category": "mee-major", "prereqs": [["MTH201"], ["CIE200"]] },
    { "id": "GNE331", "code": "GNE331", "title": "Probability and Statistics", "credits": 3, "category": "math-sci", "prereqs": [["MTH201"]] },
    { "id": "GNE333", "code": "GNE333", "title": "Engineering Analysis I", "credits": 3, "category": "math-sci", "prereqs": [["MTH201"]] },
    { "id": "MEE301", "code": "MEE301", "title": "Thermodynamics", "credits": 3, "category": "mee-major", "prereqs": [], "standing": "second-year" },
    { "id": "MEE321", "code": "MEE321", "title": "Material Properties and Processes", "credits": 3, "category": "mee-major", "prereqs": [], "standing": "second-year" },
    { "id": "MEE311", "code": "MEE311", "title": "Fluid Mechanics", "credits": 3, "category": "mee-major", "prereqs": [["MEE241"]] },
    { "id": "MEE312", "code": "MEE312", "title": "Fluid Mechanics Lab", "credits": 1, "category": "mee-major", "prereqs": [], "coreqs": ["MEE311"], "isLab": true },
    { "id": "MEE351", "code": "MEE351", "title": "Computer Aided Design", "credits": 3, "category": "mee-major", "prereqs": [["MEE211"]] },
    { "id": "MEE212", "code": "MEE212", "title": "Computer Applications in MEE", "credits": 2, "category": "mee-major",
      "prereqs": [["COE212"], ["GNE333"]],
      "hiddenPrereq": "GNE333 is required but is not drawn on the official flow chart." },
    { "id": "MEE332", "code": "MEE332", "title": "Manufacturing Processes", "credits": 3, "category": "mee-major", "prereqs": [["MEE321"]] },
    { "id": "MEE333", "code": "MEE333", "title": "Manufacturing Lab", "credits": 1, "category": "mee-major", "prereqs": [], "coreqs": ["MEE332"], "isLab": true },
    { "id": "MEE320", "code": "MEE320", "title": "Strength of Materials", "credits": 3, "category": "mee-major", "prereqs": [["CIE200"]] },
    { "id": "MEE403", "code": "MEE403", "title": "Heat Transfer", "credits": 3, "category": "mee-major", "prereqs": [["MEE311", "CIE320"], ["MTH304"]] },
    { "id": "MEE404", "code": "MEE404", "title": "Heat Transfer Lab", "credits": 1, "category": "mee-major",
      "prereqs": [["GNE331"]], "concurrent": ["MEE403"], "isLab": true,
      "hiddenPrereq": "GNE331 is required for this lab but is not drawn on the official flow chart." },
    { "id": "MEE341", "code": "MEE341", "title": "Kinematics of Machines", "credits": 3, "category": "mee-major", "prereqs": [["MEE241"], ["MEE351"]] },
    { "id": "MEE391", "code": "MEE391", "title": "Instrumentation and Measurements", "credits": 3, "category": "mee-major", "prereqs": [["ELE305"], ["GNE331"]] },
    { "id": "LAS212", "code": "LAS212", "title": "Communication in the Age of AI", "credits": 3, "category": "las-core",
      "prereqs": [], "freshmanPrereqs": ["ENG101"] },
    { "id": "GNE301", "code": "GNE301", "title": "Professional Communication", "credits": 2, "category": "gen-eng", "prereqs": [["ENG202"]] },
    { "id": "MEE414", "code": "MEE414", "title": "Thermal Systems Design", "credits": 3, "category": "mee-major", "prereqs": [["MEE403"], ["MEE301"]] },
    { "id": "GNE303", "code": "GNE303", "title": "Engineering Ethics", "credits": 2, "category": "gen-eng", "prereqs": [], "standing": "second-year" },
    { "id": "MEE442", "code": "MEE442", "title": "Mechanical Vibrations", "credits": 3, "category": "mee-major", "prereqs": [["MEE341"], ["MTH304"]] },
    { "id": "MEE443", "code": "MEE443", "title": "Mechanical Vibrations Lab", "credits": 1, "category": "mee-major",
      "prereqs": [["GNE331"]], "concurrent": ["MEE442"], "isLab": true,
      "hiddenPrereq": "GNE331 is required for this lab but is not drawn on the official flow chart." },
    { "id": "MEE445", "code": "MEE445", "title": "Control Systems", "credits": 3, "category": "mee-major", "prereqs": [["GNE333"]], "concurrent": ["MEE442"] },
    { "id": "INE320", "code": "INE320", "title": "Engineering Economy I", "credits": 3, "category": "gen-eng", "prereqs": [], "standing": "third-year" },
    { "id": "MEE491", "code": "MEE491", "title": "Seminar on Contemporary Issues in MEE", "credits": 2, "category": "mee-major", "prereqs": [], "standing": "third-year" },
    { "id": "MEE302", "code": "MEE302", "title": "Energy Conversion", "credits": 3, "category": "mee-major", "prereqs": [["MEE301"]] },
    { "id": "MEE422", "code": "MEE422", "title": "Mechanical Engineering Design", "credits": 3, "category": "mee-major", "prereqs": [["MEE320"]] },
    { "id": "INE428", "code": "INE428", "title": "Project Management", "credits": 3, "category": "gen-eng", "prereqs": [], "coreqs": ["GNE303"] },
    { "id": "MEE446", "code": "MEE446", "title": "Control Systems Lab", "credits": 1, "category": "mee-major", "prereqs": [["MEE391"], ["MEE445"]], "isLab": true },
    { "id": "MEE498", "code": "MEE498", "title": "Professional Experience", "credits": 6, "category": "mee-major",
      "prereqs": [["GNE301"]], "standing": "fifth-year", "requiresConsent": true },
    { "id": "MEE515", "code": "MEE515", "title": "Refrigeration and Air-Conditioning", "credits": 3, "category": "mee-major",
      "prereqs": [["MEE403"], ["MEE301"]], "aka": "HVAC" },
    { "id": "MEE591", "code": "MEE591", "title": "Project I", "credits": 3, "category": "mee-major",
      "prereqs": [["MEE332"]], "standing": "fifth-year", "coreqs": ["MEE414", "INE428", "MEE422", "MEE593"] },
    { "id": "MEE593", "code": "MEE593", "title": "Capstone Engineering Design", "credits": 1, "category": "mee-major",
      "prereqs": [["GNE301"]], "coreqs": ["MEE591"] },
    { "id": "MEE592", "code": "MEE592", "title": "Project II", "credits": 3, "category": "mee-major",
      "prereqs": [["MEE591"]], "standing": "fifth-year" },

    { "id": "SCI",  "title": "Science Elective", "credits": 3, "category": "math-sci", "slot": "science", "prereqs": [] },
    { "id": "LAS1", "title": "LAS Elective 1/4", "credits": 3, "category": "las-elective", "slot": "las", "prereqs": [] },
    { "id": "LAS2", "title": "LAS Elective 2/4", "credits": 3, "category": "las-elective", "slot": "las", "prereqs": [] },
    { "id": "LAS3", "title": "LAS Elective 3/4", "credits": 3, "category": "las-elective", "slot": "las", "prereqs": [] },
    { "id": "LAS4", "title": "LAS Elective 4/4", "credits": 3, "category": "las-elective", "slot": "las", "prereqs": [] },
    { "id": "TE1",  "title": "Technical Elective 1/5", "credits": 3, "category": "tech-elective", "slot": "technical", "prereqs": [] },
    { "id": "TE2",  "title": "Technical Elective 2/5", "credits": 3, "category": "tech-elective", "slot": "technical", "prereqs": [] },
    { "id": "TE3",  "title": "Technical Elective 3/5", "credits": 3, "category": "tech-elective", "slot": "technical", "prereqs": [] },
    { "id": "TE4",  "title": "Technical Elective 4/5", "credits": 3, "category": "tech-elective", "slot": "technical", "prereqs": [] },
    { "id": "TE5",  "title": "Technical Elective 5/5", "credits": 3, "category": "tech-elective", "slot": "technical", "prereqs": [] },
    { "id": "SDG",  "title": "SDG Restricted Elective", "credits": 3, "category": "tech-elective", "slot": "restricted", "prereqs": [] },
    { "id": "SOE1", "title": "SOE Signature Course", "credits": 3, "category": "gen-eng", "slot": "soe", "prereqs": [] },
    { "id": "SOE2", "title": "SOE Signature Course", "credits": 3, "category": "gen-eng", "slot": "soe", "prereqs": [] }
  ],

  "template": [
    { "year": 1, "term": "fall",   "courses": ["LAS1", "CIE200", "MTH201", "MEE211", "COE212", "ENG202"] },
    { "year": 1, "term": "spring", "courses": ["SCI", "MEE241", "MTH304", "MTH206", "ELE305"] },
    { "year": 1, "term": "summer", "courses": ["LAS2", "GNE333", "GNE331"] },
    { "year": 2, "term": "fall",   "courses": ["MEE301", "MEE321", "MEE311", "MEE312", "MEE351", "MEE212"] },
    { "year": 2, "term": "spring", "courses": ["MEE332", "MEE333", "MEE320", "MEE403", "MEE404", "MEE341", "MEE391"] },
    { "year": 2, "term": "summer", "courses": ["LAS212", "LAS3", "GNE301"] },
    { "year": 3, "term": "fall",   "courses": ["MEE414", "GNE303", "MEE442", "MEE443", "MEE445", "INE320", "MEE491"] },
    { "year": 3, "term": "spring", "courses": ["MEE302", "MEE422", "INE428", "TE1", "SDG", "MEE446"] },
    { "year": 3, "term": "summer", "courses": ["MEE498"] },
    { "year": 4, "term": "fall",   "courses": ["MEE515", "MEE591", "MEE593", "TE2", "TE3", "SOE1"] },
    { "year": 4, "term": "spring", "courses": ["LAS4", "MEE592", "TE4", "TE5", "SOE2"] }
  ],

  "slotOptions": {
    "science": {
      "label": "Science Elective",
      "pick": 1,
      "options": [
        { "code": "AST200", "title": "Introduction to Astronomy", "credits": 3 },
        { "code": "BIO201", "title": "General Biology I", "credits": 4 },
        { "code": "CHM201", "title": "Chemical Principles", "credits": 3 },
        { "code": "CHM205", "title": "Fundamentals of Chemistry", "credits": 3 },
        { "code": "ENV200", "title": "Introduction to Environmental Science", "credits": 3 },
        { "code": "PHY201", "title": "Electricity and Magnetism", "credits": 4 }
      ]
    },
    "technical": {
      "label": "Technical Elective",
      "pick": 5,
      "freeText": true,
      "options": [
        { "code": "MEE392", "title": "Machine Shop", "credits": 1, "prereqs": [], "standing": "second-year" },
        { "code": "MEE401", "title": "Energy Systems", "credits": 2, "prereqs": [], "standing": "third-year" },
        { "code": "MEE407", "title": "Internal Combustion Engines", "credits": 3, "prereqs": [["MEE302"]] },
        { "code": "MEE500", "title": "Renewable Energy", "credits": 3, "prereqs": [["MEE403"]] },
        { "code": "MEE502", "title": "Passive Building Design", "credits": 3, "prereqs": [] },
        { "code": "MEE503", "title": "Power Plant Engineering", "credits": 3, "prereqs": [["MEE302"], ["MEE414"]] },
        { "code": "MEE505", "title": "Solar System Design", "credits": 3, "prereqs": [["MEE391", "ELE401"]] },
        { "code": "MEE506", "title": "Vehicle Powertrain Systems", "credits": 3, "prereqs": [["MEE407"], ["MEE341"], ["MEE302"]] },
        { "code": "MEE507", "title": "Advanced Powertrain Systems", "credits": 3, "prereqs": [["MEE506"]] },
        { "code": "MEE514", "title": "Computational Fluid Dynamics", "credits": 3, "prereqs": [["MEE212"], ["MEE403"]] },
        { "code": "MEE517", "title": "Turbo Machinery", "credits": 3, "prereqs": [["MEE302"], ["MEE414"]] },
        { "code": "MEE519", "title": "Piping Network and Fire Protection Systems", "credits": 3, "prereqs": [["MEE414"]] },
        { "code": "MEE520", "title": "Composite Materials", "credits": 3, "prereqs": [["MEE320", "MEE321"]] },
        { "code": "MEE521", "title": "Finite Element Methods", "credits": 3, "prereqs": [["GNE333"], ["MEE320"]] },
        { "code": "MEE532", "title": "Advanced Manufacturing and AI", "credits": 3, "prereqs": [["MEE332"]], "standing": "fifth-year" },
        { "code": "MEE533", "title": "Advanced CAD/CAM", "credits": 3, "prereqs": [["MEE332"], ["MEE351"]], "standing": "fifth-year" },
        { "code": "MEE535", "title": "Micro and Surface Engineering", "credits": 3, "prereqs": [["MEE332"]] },
        { "code": "MEE536", "title": "Plastics Manufacturing", "credits": 3, "prereqs": [] },
        { "code": "MEE540", "title": "Introduction to Robotics", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE543", "title": "Acoustics and Vibration Control", "credits": 3, "prereqs": [["MEE442"]] },
        { "code": "MEE547", "title": "Robotics and Intelligent Systems", "credits": 3, "prereqs": [["MEE341"], ["MEE445"]] },
        { "code": "MEE549", "title": "Automotive Dynamics", "credits": 3, "prereqs": [["MEE311"], ["MEE351"]] },
        { "code": "MEE570", "title": "CFD for Wind Energy Engineering", "credits": 3, "prereqs": [["MEE311"]], "standing": "fifth-year" },
        { "code": "MEE590", "title": "Energy Audit", "credits": 3, "prereqs": [["MEE403"]] },
        { "code": "MEE594", "title": "Undergraduate Research Project", "credits": 3, "prereqs": [], "standing": "fifth-year", "requiresConsent": true },
        { "code": "MEE599", "title": "Topics in Mechanical Engineering", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE599AN", "title": "Tp: Industrial Automation Systems", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE599AO", "title": "Green Engineering", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE599AP", "title": "Aerospace Processes, Materials and Applications", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE599AQ", "title": "Race Car Fundamentals", "credits": 3, "prereqs": [], "standing": "fifth-year" },
        { "code": "MEE599AS", "title": "Machine Learning for Industrial and Mechanical Engineering", "credits": 3,
          "prereqs": [["GNE333"], ["COE212"], ["MEE212", "INE212"]], "standing": "fifth-year" },
        { "code": "MEE599AT", "title": "Deep Learning for Industrial and Mechanical Engineering", "credits": 3,
          "prereqs": [["GNE333"], ["COE212"], ["MEE212", "INE212"]], "standing": "fifth-year" }
      ]
    },
    "restricted": { "label": "SDG Restricted Elective", "pick": 1, "freeText": true, "options": [] },
    "soe": {
      "label": "SOE Signature Course",
      "pick": 2,
      "creditsRequired": 6,
      "variableCredits": true,
      "freeText": true,
      "note": "VIP+ courses substitute for the signature course and come in 1, 2 and 3 credit versions, so they stack until the credit total is met.",
      "options": [
        { "code": "VIP201", "title": "Vertically Integrated Projects", "credits": 1, "prereqs": [], "standing": "second-year" },
        { "code": "VIP202", "title": "Vertically Integrated Projects", "credits": 2, "prereqs": [], "standing": "second-year" },
        { "code": "VIP301", "title": "Vertically Integrated Projects", "credits": 1, "prereqs": [], "standing": "third-year" },
        { "code": "VIP302", "title": "Vertically Integrated Projects", "credits": 2, "prereqs": [], "standing": "third-year" },
        { "code": "VIP303", "title": "Vertically Integrated Projects", "credits": 3, "prereqs": [], "standing": "third-year" },
        { "code": "VIP401", "title": "Vertically Integrated Projects", "credits": 1, "prereqs": [], "standing": "fourth-year" },
        { "code": "VIP402", "title": "Vertically Integrated Projects", "credits": 2, "prereqs": [], "standing": "fourth-year" },
        { "code": "VIP403", "title": "Vertically Integrated Projects", "credits": 3, "prereqs": [], "standing": "fourth-year" }
      ]
    },
    "las": {
      "label": "LAS Elective",
      "pick": 4,
      "freeText": true,
      "curriculum": "Z2026",
      "requirements": [
        { "id": "ai",          "label": "Artificial Intelligence", "credits": 3, "count": 1 },
        { "id": "changemaker", "label": "Change Makers",           "credits": 6, "count": 2 },
        { "id": "arts",        "label": "LAS Free Elective, Arts and Humanities", "credits": 3, "count": 1 }
      ],
      "options": []
    }
  },

  "sources": [
    "LAU Flow Chart, Mechanical Engineering Program, effective Fall 2026",
    "LAU Academic Catalog 2026-2027, course descriptions",
    "LAU Academic Catalog 2026-2027, Academic Rules and Procedures",
    "LAU School of Engineering, VIP+ model and schedule"
  ]
};
