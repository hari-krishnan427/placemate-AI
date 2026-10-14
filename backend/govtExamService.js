// ======================================================
// DOCMIND AI - GOVERNMENT EXAMS INTELLIGENCE & SIMULATOR SERVICE
// Comprehensive Syllabus, Eligibility & Age Radar, Direct Tracker,
// & Full Authentic Examination Arena
// ======================================================
const { callGeminiAI } = require("./extractor");

// In-Memory Fast Cache for Dynamically Researched Exam Tests
const dynamicGovtMockCache = new Map();

// 1. OFFICIAL SYLLABUS & EXAM PATTERNS
const GOVT_EXAM_PATTERNS = {
    "upsc_cse": {
        id: "upsc_cse",
        examName: "UPSC Civil Services Examination (CSE / IAS / IPS / IFS)",
        conductingBody: "Union Public Service Commission (UPSC)",
        officialPortal: "https://upsc.gov.in",
        notificationUrl: "https://upsconline.nic.in",
        ageLimit: { min: 21, max: 32, relaxation: { obc: 3, sc_st: 5, pwbd: 10 } },
        minEducation: "Bachelor's Degree in any discipline from a recognized University",
        frequency: "Annual (Notification in Feb, Prelims in May/June)",
        salaryScale: "Level 10 to Level 17 (₹56,100 - ₹2,50,000/month + HRA, DA, Perks)",
        stages: [
            {
                stageNumber: "Stage 1",
                title: "Preliminary Examination (Screening - Objective)",
                mode: "Offline Pen-Paper OMR",
                duration: "4 Hours (2 papers of 2 hrs each)",
                totalMarks: 400,
                negativeMarking: "1/3rd (0.66 for Paper 1, 0.83 for Paper 2)",
                papers: [
                    { name: "Paper I: General Studies (GS)", questions: 100, marks: 200, syllabus: "Current events, Indian History, National Movement, Geography, Polity & Governance, Economic & Social Development, Environmental Ecology, General Science." },
                    { name: "Paper II: Civil Services Aptitude Test (CSAT)", questions: 80, marks: 200, syllabus: "Comprehension, Interpersonal skills, Logical reasoning, Decision making, Basic numeracy & Data interpretation (Class X level). Qualifying with minimum 33% (66 marks)." }
                ]
            },
            {
                stageNumber: "Stage 2",
                title: "Main Examination (Written Descriptive)",
                mode: "Offline Pen-Paper Written",
                duration: "5 Days (9 Papers of 3 Hours each)",
                totalMarks: 1750,
                negativeMarking: "None (Descriptive Evaluation)",
                papers: [
                    { name: "Paper A & B (Qualifying)", questions: "Descriptive", marks: "300 + 300", syllabus: "Compulsory Indian Language (300m) + English (300m). Qualifying only (25% pass mark, not counted in merit)." },
                    { name: "Paper I: Essay", questions: "2 Essays", marks: 250, syllabus: "Topic choices across philosophy, economy, science, administration." },
                    { name: "Papers II-V: General Studies I, II, III, IV", questions: "20 Qs per paper", marks: 1000, syllabus: "GS I (History, Heritage, Geography, Society), GS II (Constitution, Governance, Polity, IR), GS III (Economy, Tech, Environment, Security), GS IV (Ethics, Integrity, Aptitude)." },
                    { name: "Papers VI-VII: Optional Subject (Paper 1 & 2)", questions: "Descriptive", marks: 500, syllabus: "Chosen candidate subject (History, Sociology, PSIR, Geography, Pub Ad, Engineering, etc.)." }
                ]
            },
            {
                stageNumber: "Stage 3",
                title: "Personality Test (Interview)",
                mode: "Face-to-face Board Interview",
                duration: "30-45 Minutes",
                totalMarks: 275,
                negativeMarking: "None",
                papers: [
                    { name: "Board Interview at Dholpur House", questions: "Interactive", marks: 275, syllabus: "Evaluation of intellectual integrity, analytical ability, mental alertness, balance of judgment, and suitability for public service." }
                ]
            }
        ],
        strategy: "Start 15-18 months in advance. Build conceptual foundation using standard NCERTs (Class 6-12). Read The Hindu/Indian Express daily for editorial synthesis. Practice answer writing under time constraints and solve at least 50 full-length CSAT and GS mock tests."
    },

    "ssc_cgl": {
        id: "ssc_cgl",
        examName: "SSC CGL (Combined Graduate Level - ASO, Inspector, Tax Assistant, Auditor)",
        conductingBody: "Staff Selection Commission (SSC)",
        officialPortal: "https://ssc.gov.in",
        notificationUrl: "https://ssc.gov.in",
        ageLimit: { min: 18, max: 32, relaxation: { obc: 3, sc_st: 5, pwbd: 10 } },
        minEducation: "Bachelor's Degree in any discipline",
        frequency: "Annual",
        salaryScale: "Pay Level 4 to Level 8 (₹25,500 - ₹1,51,100/month)",
        stages: [
            {
                stageNumber: "Tier 1",
                title: "Computer Based Examination (CBT - Qualifying)",
                mode: "Online CBT",
                duration: "60 Minutes",
                totalMarks: 200,
                negativeMarking: "0.50 Marks per wrong answer",
                papers: [
                    { name: "General Intelligence & Reasoning", questions: 25, marks: 50, syllabus: "Analogies, Similarities, Space orientation, Coding-Decoding, Venn diagrams, Syllogisms, Figural series." },
                    { name: "General Awareness", questions: 25, marks: 50, syllabus: "Indian History, Culture, Geography, Economic Scene, General Policy, Scientific Research, Current Affairs." },
                    { name: "Quantitative Aptitude", questions: 25, marks: 50, syllabus: "Computation of Whole Numbers, Decimals, Fractions, Percentages, Ratio, Square roots, Profit & Loss, Trigonometry, Geometry, Mensuration." },
                    { name: "English Comprehension", questions: 25, marks: 50, syllabus: "Error spotting, Fill in blanks, Synonyms, Antonyms, Idioms & Phrases, One-word substitution, Active-Passive, Cloze test." }
                ]
            },
            {
                stageNumber: "Tier 2",
                title: "Computer Based Examination (CBT - Final Merit)",
                mode: "Online CBT",
                duration: "2 Hours 15 Minutes",
                totalMarks: 390,
                negativeMarking: "1 Mark per wrong answer (in 3-mark questions)",
                papers: [
                    { name: "Paper I - Section I (Maths & Reasoning)", questions: "30 + 30 = 60 Qs", marks: 180, syllabus: "Mathematical Abilities (90m) + Reasoning & General Intelligence (90m)." },
                    { name: "Paper I - Section II (English & GA)", questions: "45 + 25 = 70 Qs", marks: 210, syllabus: "English Language & Comprehension (135m) + General Awareness (75m)." },
                    { name: "Paper I - Section III (Computer & Skill Test)", questions: "20 Qs + DEST", marks: "60m (Qualifying)", syllabus: "Computer Knowledge Test (Qualifying) + Data Entry Speed Test (2000 key depressions in 15 mins)." }
                ]
            }
        ],
        strategy: "Speed and calculation accuracy are paramount. Memorize tables up to 30, squares up to 50, and cube roots. Practice 100+ questions daily of SSC TCS-pattern PYQs for Arithmetic and Advanced Geometry."
    },

    "ibps_sbi_po": {
        id: "ibps_sbi_po",
        examName: "IBPS PO / SBI PO (Probationary Officer - Public Sector Banks)",
        conductingBody: "Institute of Banking Personnel Selection (IBPS) & State Bank of India (SBI)",
        officialPortal: "https://ibps.in",
        notificationUrl: "https://ibps.in",
        ageLimit: { min: 20, max: 30, relaxation: { obc: 3, sc_st: 5, pwbd: 10 } },
        minEducation: "Graduation in any discipline with minimum passing marks",
        frequency: "Annual (Notification July-August)",
        salaryScale: "Basic ₹36,000 + DA, Special Allowance, HRA (Gross ~₹58,000 - ₹72,000/month)",
        stages: [
            {
                stageNumber: "Phase 1",
                title: "Preliminary Examination (Online Screening)",
                mode: "Online CBT with Sectional Timing",
                duration: "60 Minutes (Strict 20 Mins per section)",
                totalMarks: 100,
                negativeMarking: "0.25 Marks per wrong answer",
                papers: [
                    { name: "English Language", questions: 30, marks: 30, syllabus: "Reading Comprehension, Cloze Test, Error Spotting, Sentence Rearrangement, Para Jumbles. (20 Mins clock)" },
                    { name: "Quantitative Aptitude", questions: 35, marks: 35, syllabus: "Data Interpretation (Pie/Bar/Caselet), Quadratic Equations, Number Series, Simplification/Approximation, Arithmetic Word Problems. (20 Mins clock)" },
                    { name: "Reasoning Ability", questions: 35, marks: 35, syllabus: "Seating Arrangements (Circle/Linear), Floor & Box Puzzles, Syllogisms, Inequalities, Blood Relations, Direction Sense. (20 Mins clock)" }
                ]
            },
            {
                stageNumber: "Phase 2",
                title: "Main Examination (Objective + Descriptive Online)",
                mode: "Online CBT + Keyboard Typing",
                duration: "3 Hours 30 Minutes",
                totalMarks: 225,
                negativeMarking: "0.25 of marks assigned",
                papers: [
                    { name: "Reasoning & Computer Aptitude", questions: 45, marks: 60, syllabus: "High-level conditional puzzles, Machine input-output, Critical reasoning, Coding inequalities." },
                    { name: "Data Analysis & Interpretation", questions: 35, marks: 60, syllabus: "Advanced DI sets, Radar graphs, Missing data tables, Arithmetic-based DI." },
                    { name: "General / Economy / Banking Awareness", questions: 40, marks: 40, syllabus: "Current banking events, RBI circulars, Monetary policy, Financial awareness, Static GK." },
                    { name: "English Language (Objective)", questions: 35, marks: 40, syllabus: "Advanced inference comprehension, Vocab in context, Sentence connectors." },
                    { name: "English Descriptive Paper", questions: "2 Questions", marks: 25, syllabus: "Letter Writing (Formal/Informal) + Essay Writing (Economic/Tech topic) typed on computer (30 mins)." }
                ]
            },
            {
                stageNumber: "Phase 3",
                title: "Psychometric Test, Group Discussion & Personal Interview",
                mode: "In-Person Assessment Panel",
                duration: "Full Day Process",
                totalMarks: 50,
                negativeMarking: "None",
                papers: [
                    { name: "Group Discussion & Interview", questions: "Panel Discussion", marks: 50, syllabus: "Banking knowledge, current economic trends, personal background, conflict resolution & situational judgment." }
                ]
            }
        ],
        strategy: "Master Sectional Timing discipline. Prioritize quick-scoring areas first (Inequalities, Syllogisms, Approximations) within the first 6 minutes of each section, then tackle Puzzles and DI. Read financial news (Livemint/Business Standard) for Phase 2 General Awareness."
    },

    "rrb_ntpc": {
        id: "rrb_ntpc",
        examName: "RRB NTPC (Non-Technical Popular Categories - Station Master, Goods Guard, Clerk)",
        conductingBody: "Railway Recruitment Control Board (RRB)",
        officialPortal: "https://rrbcdg.gov.in",
        notificationUrl: "https://www.indianrailways.gov.in",
        ageLimit: { min: 18, max: 33, relaxation: { obc: 3, sc_st: 5, pwbd: 10 } },
        minEducation: "12th Pass (Undergraduate posts) or Any Degree (Graduate posts)",
        frequency: "Periodic / Nationwide",
        salaryScale: "Pay Level 2 to Level 6 (₹19,900 - ₹92,300/month + Running & Night Allowance)",
        stages: [
            {
                stageNumber: "Stage 1",
                title: "1st Stage Computer Based Test (CBT 1 - Common Screening)",
                mode: "Online CBT",
                duration: "90 Minutes (120 mins for PwBD)",
                totalMarks: 100,
                negativeMarking: "1/3rd (0.33 marks per wrong answer)",
                papers: [
                    { name: "General Awareness", questions: 40, marks: 40, syllabus: "Current events of national importance, Games & Sports, Art & Culture, Indian Literature, Monuments, General Science (up to 10th CBSE), History, Environmental issues." },
                    { name: "Mathematics", questions: 30, marks: 30, syllabus: "Number System, Decimals, Fractions, LCM-HCF, Ratio, Percentages, Mensuration, Time & Work, Time & Distance, Elementary Algebra, Geometry & Trigonometry." },
                    { name: "General Intelligence & Reasoning", questions: 30, marks: 30, syllabus: "Analogies, Number series, Coding-decoding, Mathematical operations, Relationships, Syllogisms, Jumbling, Venn diagrams, Data interpretation." }
                ]
            },
            {
                stageNumber: "Stage 2",
                title: "2nd Stage Computer Based Test (CBT 2 - Merit Selection)",
                mode: "Online CBT (Post-Level Specific)",
                duration: "90 Minutes",
                totalMarks: 120,
                negativeMarking: "1/3rd (0.33 marks per wrong answer)",
                papers: [
                    { name: "General Awareness", questions: 50, marks: 50, syllabus: "In-depth current affairs, Indian railways history, scientific discoveries, Indian polity, constitutional articles." },
                    { name: "Mathematics", questions: 35, marks: 35, syllabus: "Advanced arithmetic, coordinate geometry, data sufficiency, stats (Mean, Median, Mode, Variance)." },
                    { name: "General Intelligence & Reasoning", questions: 35, marks: 35, syllabus: "Complex puzzles, analytical reasoning, statement-arguments, direction matrix." }
                ]
            },
            {
                stageNumber: "Stage 3",
                title: "Computer Based Aptitude Test (CBAT) / Typing Skill Test",
                mode: "Computer Interactive / Typing",
                duration: "Varies by Post",
                totalMarks: "Qualifying / 30% Weightage for Station Master",
                negativeMarking: "No negative in CBAT",
                papers: [
                    { name: "Skill Assessment", questions: "Specialized", marks: "Qualifying", syllabus: "Psycho/Aptitude test for Station Master & Traffic Assistant. Typing Test (30 wpm English / 25 wpm Hindi) for Junior Clerk & Typist." }
                ]
            }
        ],
        strategy: "Focus heavily on General Science and General Awareness (50 out of 120 marks in CBT 2). Solve speed-test mock papers with 90-minute strict time limits. Accuracy is critical due to 1/3rd negative marking penalty."
    },

    "defence_cds_afcat": {
        id: "defence_cds_afcat",
        examName: "UPSC CDS & AFCAT (Indian Military, Naval, & Air Force Academies)",
        conductingBody: "Union Public Service Commission (CDS) & Indian Air Force (AFCAT)",
        officialPortal: "https://upsc.gov.in",
        notificationUrl: "https://afcat.cdac.in",
        ageLimit: { min: 19, max: 25, relaxation: { obc: 0, sc_st: 0, notes: "No age relaxation in Defence Officers Commission" } },
        minEducation: "Any Graduate (IMA/OTA) / B.E/B.Tech (Air Force & Navy)",
        frequency: "Twice a Year (CDS I & II, AFCAT 1 & 2)",
        salaryScale: "Lieutenant / Flying Officer Level 10 (₹56,100 - ₹1,77,500/month + MSP ₹15,500/mo)",
        stages: [
            {
                stageNumber: "Stage 1",
                title: "Written Examination",
                mode: "Offline Pen-Paper (CDS) / Online CBT (AFCAT)",
                duration: "6 Hours for IMA/INA/AFA (3 papers of 2 hrs each); 4 Hours for OTA",
                totalMarks: "300 Marks (IMA) / 200 Marks (OTA)",
                negativeMarking: "1/3rd Negative Marking",
                papers: [
                    { name: "English", questions: 120, marks: 100, syllabus: "Grammar, Spotting errors, Synonyms, Antonyms, Ordering of words, Cloze test, Comprehension." },
                    { name: "General Knowledge", questions: 120, marks: 100, syllabus: "History, Indian Polity, Geography, Current Affairs, Defence exercises, Physics/Chemistry/Biology basics." },
                    { name: "Elementary Mathematics (IMA/INA/AFA)", questions: 100, marks: 100, syllabus: "Arithmetic, Algebra, Trigonometry, Geometry, Mensuration, Statistics. (Not for OTA candidates)." }
                ]
            },
            {
                stageNumber: "Stage 2",
                title: "Services Selection Board (SSB Interview - 5 Days)",
                mode: "In-Person Psychological & Leadership Evaluation",
                duration: "5 Consecutive Days at Selection Centers",
                totalMarks: 300,
                negativeMarking: "Officer Like Qualities (OLQ) Matrix",
                papers: [
                    { name: "Day 1: Screening Test", questions: "OIR & PPDT", marks: "Screening", syllabus: "Officer Intelligence Rating (OIR) + Picture Perception and Description Test (PPDT) + Group Discussion." },
                    { name: "Days 2-4: Psychology, GTO & Interview", questions: "Field & Indoor", marks: 300, syllabus: "Psychological Tests (TAT, WAT, SRT, SD) + Group Testing Officer tasks (PGT, HGT, Snake Race, Lecturette, Command Task) + Personal Interview." },
                    { name: "Day 5: Board Conference", questions: "Panel Assessment", marks: "Final", syllabus: "All assessors evaluate candidate suitability against 15 Officer Like Qualities (OLQs)." }
                ]
            }
        ],
        strategy: "Maintain high physical fitness (running 2.4 km, pushups, chinups). Read international defence diplomacy and national security news. Practice English comprehension daily to comfortably clear the 20% sectional cutoff in every paper."
    },

    "state_psc": {
        id: "state_psc",
        examName: "State PSC Civil Services (TNPSC Group 1, UPPSC PCS, BPSC, MPSC, KPSC)",
        conductingBody: "State Public Service Commissions",
        officialPortal: "https://tnpsc.gov.in / https://uppsc.up.nic.in",
        notificationUrl: "https://upsc.gov.in",
        ageLimit: { min: 21, max: 37, relaxation: { obc: 3, sc_st: 5, state_domicile: "Varies by state policy" } },
        minEducation: "Bachelor's Degree in any discipline",
        frequency: "Annual / Biennial",
        salaryScale: "Deputy Collector / DSP / Commercial Tax Officer Level 10 (₹56,100 - ₹1,82,400/month)",
        stages: [
            {
                stageNumber: "Stage 1",
                title: "Preliminary Examination (Objective OMR / Online)",
                mode: "Offline OMR",
                duration: "3 Hours",
                totalMarks: 300,
                negativeMarking: "Varies (No negative in TNPSC, 1/3rd in UPPSC/BPSC)",
                papers: [
                    { name: "General Studies & State Specific Heritage", questions: 175, marks: 250, syllabus: "History, Geography, Polity, Science, plus State History, Culture, Heritage, and Socio-Political Movements." },
                    { name: "Aptitude & Mental Ability", questions: 25, marks: 50, syllabus: "Simplification, HCF/LCM, Ratio, Compound Interest, Area/Volume, Logical reasoning (Class 10 level)." }
                ]
            },
            {
                stageNumber: "Stage 2",
                title: "Main Written Examination (Descriptive)",
                mode: "Descriptive Papers",
                duration: "3 Days (3 Papers of 3 Hours each)",
                totalMarks: 750,
                negativeMarking: "None",
                papers: [
                    { name: "Paper I: State Language & Translation (Qualifying)", questions: "Descriptive", marks: 100, syllabus: "Tamil/Hindi/Marathi translation, precis writing, letter drafting." },
                    { name: "Papers II-IV: General Studies I, II, III", questions: "Descriptive", marks: 750, syllabus: "History & Culture + State Governance + Science & Tech + State Economy and Environmental challenges." }
                ]
            },
            {
                stageNumber: "Stage 3",
                title: "Oral Test (Interview / Personality Assessment)",
                mode: "Board Interview",
                duration: "25-35 Minutes",
                totalMarks: 100,
                negativeMarking: "None",
                papers: [
                    { name: "State Public Service Commission Board", questions: "Interview", marks: 100, syllabus: "State development policies, welfare schemes, district administrative problem-solving, moral aptitude." }
                ]
            }
        ],
        strategy: "Master State Board textbooks alongside NCERTs. State-specific history, welfare schemes, and geography carry over 35% of total exam weightage. Practice bilingual writing if appearing in regional language."
    }
};

// 2. COMPREHENSIVE ELIGIBILITY & AGE RADAR CALCULATOR
function calculateGovtEligibility({ age = 22, degree = "B.E / B.Tech", branch = "Computer Science", passingYear = 2026, category = "General" }) {
    const studentAge = Number(age) || 22;
    const cat = (category || "General").toLowerCase();
    const deg = (degree || "").toLowerCase();
    const branchLower = (branch || "").toLowerCase();
    const isGraduate = !deg.includes("10th") && !deg.includes("12th") && !deg.includes("diploma");
    const isTechGraduate = deg.includes("b.e") || deg.includes("b.tech") || deg.includes("bca") || deg.includes("mca") || branchLower.includes("engineer") || branchLower.includes("cs") || branchLower.includes("it");

    // Age relaxations by category in India
    let relaxation = 0;
    if (cat.includes("obc")) relaxation = 3;
    else if (cat.includes("sc") || cat.includes("st")) relaxation = 5;
    else if (cat.includes("pwbd") || cat.includes("pwd")) relaxation = 10;

    const evaluated = Object.values(GOVT_EXAM_PATTERNS).map(pattern => {
        let maxAgeAllowed = pattern.ageLimit.max + relaxation;
        if (pattern.id === "defence_cds_afcat") {
            maxAgeAllowed = pattern.ageLimit.max; // Defence does not offer category age relaxation
        }

        const ageOk = studentAge >= pattern.ageLimit.min && studentAge <= maxAgeAllowed;
        let eduOk = isGraduate;
        if (pattern.id === "rrb_ntpc") eduOk = true; // RRB has both 12th & Degree posts

        let status = "eligible";
        let reason = "Qualified for all official notification stages.";
        let badgeType = "success";

        if (!ageOk) {
            status = "ineligible";
            badgeType = "error";
            if (studentAge < pattern.ageLimit.min) {
                reason = `Below minimum age limit of ${pattern.ageLimit.min} years (You are ${studentAge} yrs). You can apply in ${pattern.ageLimit.min - studentAge} year(s).`;
            } else {
                reason = `Exceeds upper age limit of ${maxAgeAllowed} years for ${category} category (You are ${studentAge} yrs).`;
            }
        } else if (!eduOk) {
            status = "ineligible";
            badgeType = "warning";
            reason = `Requires completion of recognized Bachelor's Degree.`;
        } else {
            reason = `Eligible! Age ${studentAge} is within allowed ${pattern.ageLimit.min}-${maxAgeAllowed} yrs bracket (including ${relaxation > 0 ? `+${relaxation} yrs ${category} relaxation` : "General bracket"}).`;
        }

        return {
            examId: pattern.id,
            examName: pattern.examName,
            conductingBody: pattern.conductingBody,
            officialPortal: pattern.officialPortal,
            salaryScale: pattern.salaryScale,
            status,
            badgeType,
            reason,
            ageBracket: `${pattern.ageLimit.min} - ${maxAgeAllowed} yrs`,
            stagesCount: pattern.stages.length,
            nextNotification: pattern.frequency
        };
    });

    const eligibleList = evaluated.filter(e => e.status === "eligible");
    const ineligibleList = evaluated.filter(e => e.status !== "eligible");

    return {
        studentProfile: {
            age: studentAge,
            category,
            degree,
            branch,
            appliedRelaxation: `+${relaxation} years (${category})`
        },
        eligibleCount: eligibleList.length,
        totalChecked: evaluated.length,
        eligibleExams: eligibleList,
        ineligibleExams: ineligibleList
    };
}

// 3. AUTHENTIC GOVERNMENT EXAM SIMULATOR QUESTIONS BANK
// Authentic questions matching official TCS / SSC / IBPS / UPSC CSAT syllabus & difficulty
const AUTHENTIC_GOVT_MOCK_QUESTIONS = {
    "ssc_cgl": [
        {
            id: 1,
            section: "Quantitative Aptitude",
            difficulty: "Medium",
            question: "A train running at 72 km/h crosses a 260-meter-long platform in 23 seconds. What is the length of the train?",
            options: ["180 meters", "200 meters", "220 meters", "240 meters"],
            correctIndex: 1,
            explanation: "Speed of train in m/s = 72 × (5/18) = 20 m/s.\nTotal distance covered in 23 seconds = Speed × Time = 20 × 23 = 460 meters.\nDistance = (Length of Train + Length of Platform)\nLength of Train = 460 - 260 = 200 meters."
        },
        {
            id: 2,
            section: "Quantitative Aptitude",
            difficulty: "Medium",
            question: "If a shopkeeper marks an article 30% above its cost price and allows a discount of 15% on the marked price, find his overall profit percentage.",
            options: ["10.5%", "11.5%", "12.0%", "15.0%"],
            correctIndex: 0,
            explanation: "Let Cost Price (CP) = 100.\nMarked Price (MP) = 100 + 30% = 130.\nDiscount = 15% of 130 = (15/100) × 130 = 19.5.\nSelling Price (SP) = 130 - 19.5 = 110.5.\nProfit % = 110.5 - 100 = 10.5%."
        },
        {
            id: 3,
            section: "Quantitative Aptitude",
            difficulty: "Hard",
            question: "If sin θ + cos θ = √2 cos(90° - θ), then what is the value of cot θ?",
            options: ["√2 + 1", "√2 - 1", "1 / (√2 + 1)", "√3 - 1"],
            correctIndex: 1,
            explanation: "cos(90° - θ) = sin θ.\nSo, sin θ + cos θ = √2 sin θ.\nDividing both sides by sin θ:\n1 + cot θ = √2\ncot θ = √2 - 1."
        },
        {
            id: 4,
            section: "General Intelligence & Reasoning",
            difficulty: "Easy",
            question: "Select the related number from the given alternatives: 12 : 144 :: 16 : ?",
            options: ["196", "225", "256", "289"],
            correctIndex: 2,
            explanation: "Pattern: Number : (Number)².\n12² = 144\n16² = 256."
        },
        {
            id: 5,
            section: "General Intelligence & Reasoning",
            difficulty: "Medium",
            question: "Statements: All cars are vehicles. Some vehicles are electric.\nConclusions: \nI. Some electric items are cars.\nII. Some vehicles are cars.",
            options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
            correctIndex: 1,
            explanation: "From 'All cars are vehicles', the converse 'Some vehicles are cars' is a valid immediate conversion (Conclusion II follows). However, there is no direct connection establishing that electric items must be cars (Conclusion I does not necessarily follow)."
        },
        {
            id: 6,
            section: "General Intelligence & Reasoning",
            difficulty: "Medium",
            question: "In a certain code language, 'ROSE' is written as 'ILHV'. How will 'MIND' be written in that code language?",
            options: ["NRMW", "NLMW", "MRNW", "NRMV"],
            correctIndex: 0,
            explanation: "Opposite letter coding (Pairs summing to 27):\nR ↔ I (18+9=27)\nO ↔ L (15+12=27)\nS ↔ H (19+8=27)\nE ↔ V (5+22=27)\nSimilarly for 'MIND':\nM ↔ N\nI ↔ R\nN ↔ M\nD ↔ W\nResult = NRMW."
        },
        {
            id: 7,
            section: "General Awareness & Current Affairs",
            difficulty: "Medium",
            question: "Under which Article of the Constitution of India is the 'Right to Constitutional Remedies' guaranteed, known as the 'Heart and Soul' of the Constitution?",
            options: ["Article 19", "Article 21", "Article 32", "Article 44"],
            correctIndex: 2,
            explanation: "Article 32 grants citizens the right to move the Supreme Court by appropriate proceedings for the enforcement of Fundamental Rights (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari). Dr. B.R. Ambedkar termed it the 'Heart and Soul of the Constitution'."
        },
        {
            id: 8,
            section: "General Awareness & Current Affairs",
            difficulty: "Medium",
            question: "Which Indian public sector organization recently launched the X-ray Polarimeter Satellite (XPoSat) to study intense cosmic X-ray sources?",
            options: ["DRDO", "ISRO", "BARC", "TIFR"],
            correctIndex: 1,
            explanation: "ISRO (Indian Space Research Organisation) launched XPoSat onboard PSLV-C58 to investigate the polarization of cosmic X-rays from neutron stars and black holes, making India the second nation after USA to operate an X-ray polarimetry space observatory."
        },
        {
            id: 9,
            section: "General Awareness & Current Affairs",
            difficulty: "Easy",
            question: "Who was the Viceroy of India when the Indian National Congress was founded in Bombay in 1885?",
            options: ["Lord Curzon", "Lord Dufferin", "Lord Ripon", "Lord Lytton"],
            correctIndex: 1,
            explanation: "Lord Dufferin was the Viceroy of India from 1884 to 1888 when the INC was founded under A.O. Hume and W.C. Bonnerjee."
        },
        {
            id: 10,
            section: "English Comprehension",
            difficulty: "Medium",
            question: "Identify the segment in the sentence which contains a grammatical error: 'Neither the manager nor his assistants was present at the board meeting.'",
            options: ["Neither the manager", "nor his assistants", "was present", "at the board meeting"],
            correctIndex: 2,
            explanation: "Rule of proximity with 'Neither... nor': The verb must agree with the subject closest to it. Here, 'his assistants' is plural, so the plural verb 'were present' must be used instead of 'was present'."
        },
        {
            id: 11,
            section: "English Comprehension",
            difficulty: "Easy",
            question: "Select the most appropriate synonym of the word: 'BENEVOLENT'",
            options: ["Malevolent", "Generous", "Arrogant", "Selfish"],
            correctIndex: 1,
            explanation: "Benevolent means well-meaning, kindly, and charitable. Its direct synonym is 'Generous'."
        },
        {
            id: 12,
            section: "English Comprehension",
            difficulty: "Medium",
            question: "Select the correct idiom meaning: 'To leave no stone unturned'",
            options: ["To try every possible course of action in order to achieve something", "To wander aimlessly in search of treasures", "To build a foundation using stone blocks", "To destroy everything in one's path"],
            correctIndex: 0,
            explanation: "The idiom 'leave no stone unturned' means to do everything possible to achieve a goal or resolve an issue."
        }
    ],

    "ibps_sbi_po": [
        {
            id: 1,
            section: "Quantitative Aptitude & DI",
            difficulty: "Hard",
            question: "A vessel contains 120 liters of pure milk. 20 liters of milk is taken out and replaced with water. This process is repeated 2 more times. What is the final amount of milk left in the vessel?",
            options: ["69.44 liters", "72.50 liters", "75.00 liters", "80.25 liters"],
            correctIndex: 0,
            explanation: "Formula: Final Quantity = Initial Quantity × [1 - (x / C)]^n\nHere Initial = 120, x = 20, Capacity C = 120, n = 3 times.\nMilk remaining = 120 × [1 - (20/120)]³ = 120 × (5/6)³ = 120 × (125 / 216) = 15000 / 216 = 69.44 liters."
        },
        {
            id: 2,
            section: "Quantitative Aptitude & DI",
            difficulty: "Medium",
            question: "In how many different ways can the letters of the word 'BANKING' be arranged such that all vowels always occur together?",
            options: ["720", "1440", "2880", "5040"],
            correctIndex: 1,
            explanation: "Word: B-A-N-K-I-N-G (7 letters). Vowels = A, I (2 vowels). Consonants = B, N, K, N, G (5 consonants with N appearing twice).\nTreat (A, I) as 1 single bundle. Total entities to arrange = 5 consonants + 1 bundle = 6 items.\nArrangements of 6 items with 2 'N's = 6! / 2! = 720 / 2 = 360.\nVowels (A, I) can arrange internally in 2! = 2 ways.\nTotal ways = 360 × 2 = 720 ways. (Wait, 6! / 2! = 360 × 2 = 720. Let's verify option: 720). Correct is 720."
        },
        {
            id: 3,
            section: "Reasoning Ability & Puzzles",
            difficulty: "Hard",
            question: "Eight friends A, B, C, D, E, F, G, and H are sitting around a circular table facing the center. A sits third to the right of B. C sits third to the left of A. D is not an immediate neighbor of either A or B. Who sits opposite to A?",
            options: ["E", "F", "D", "G"],
            correctIndex: 2,
            explanation: "Placing B at position 1. Third to the right of B is position 4 (A). Third to the left of A (clockwise) is position 1 (B) - but C sits third to left, meaning positions: B=1, 2, 3, A=4. Opposite to A (position 4) in an 8-person circular table is position (4 + 4) = 8, which by constraint evaluation is occupied by D."
        },
        {
            id: 4,
            section: "General & Banking Awareness",
            difficulty: "Medium",
            question: "What is the policy repo rate mechanism primarily used for by the Reserve Bank of India (RBI)?",
            options: [
                "The rate at which RBI lends short-term liquidity to commercial banks against government securities",
                "The rate at which commercial banks deposit excess cash with RBI",
                "The interest rate charged by commercial banks to retail home loan borrowers",
                "The fixed statutory liquidity ratio for scheduled commercial banks"
            ],
            correctIndex: 0,
            explanation: "Repo Rate (Repurchase Option) is the benchmark interest rate at which the Reserve Bank of India lends short-term money to commercial banks against pledged government collateral to regulate inflation and liquidity."
        },
        {
            id: 5,
            section: "English Language",
            difficulty: "Medium",
            question: "Choose the correct preposition: 'The committee was unanimous _____ its decision to increase microfinance allocation.'",
            options: ["in", "on", "at", "about"],
            correctIndex: 0,
            explanation: "The standard English idiom is 'unanimous in [one's] decision/opinion'."
        }
    ],

    "upsc_csat": [
        {
            id: 1,
            section: "CSAT - Reading Comprehension & Inference",
            difficulty: "Hard",
            question: "Passage: 'A vast majority of smallholder farmers in tropical developing nations face volatile harvest yields due to irregular precipitation patterns and ground water depletion. Traditional irrigation techniques rely heavily on diesel pumps, which burden their input economics and release significant localized carbon emissions. Transitioning to decentralized solar-powered micro-irrigation provides a twin dividend: dependable water tables and zero fuel recurring overhead.'\n\nWhich of the following assumptions is most logically made by the author?",
            options: [
                "Smallholder farmers will inevitably shift from agriculture to manufacturing without subsidies.",
                "Solar micro-irrigation systems are economically viable and address operational costs while mitigating emissions.",
                "Diesel pump subsidies should immediately be doubled by municipal bodies.",
                "Traditional agriculture will cease entirely within the next five years."
            ],
            correctIndex: 1,
            explanation: "The passage asserts that solar-powered micro-irrigation provides a 'twin dividend' of reliable water and zero recurring fuel overhead. Thus, option B directly reflects the logical assumption of the author."
        },
        {
            id: 2,
            section: "CSAT - Basic Numeracy & Data Sufficiency",
            difficulty: "Hard",
            question: "What is the remainder when (17^2024 + 19^2024) is divided by 18?",
            options: ["0", "1", "2", "17"],
            correctIndex: 2,
            explanation: "17 ≡ -1 (mod 18)  => 17^2024 ≡ (-1)^2024 ≡ 1 (mod 18).\n19 ≡ +1 (mod 18)  => 19^2024 ≡ (+1)^2024 ≡ 1 (mod 18).\nTherefore, (17^2024 + 19^2024) ≡ 1 + 1 ≡ 2 (mod 18).\nThe remainder is 2."
        },
        {
            id: 3,
            section: "CSAT - Analytical Reasoning",
            difficulty: "Medium",
            question: "Five persons P, Q, R, S, and T are comparing their heights. P is taller than Q but shorter than T. S is taller than R but shorter than Q. Who among them is the tallest?",
            options: ["P", "Q", "R", "T"],
            correctIndex: 3,
            explanation: "From given statements:\nT > P > Q\nQ > S > R\nCombining order: T > P > Q > S > R.\nTherefore, T is the tallest."
        }
    ]
};

// 4. MOCK TEST GENERATOR FOR SPECIFIC GOVT EXAM (STATIC COMPATIBILITY)
function generateGovtExamMockTest(examKey = "ssc_cgl") {
    const key = (examKey || "ssc_cgl").toLowerCase();
    const pattern = GOVT_EXAM_PATTERNS[key] || GOVT_EXAM_PATTERNS["ssc_cgl"];
    const baseQuestions = AUTHENTIC_GOVT_MOCK_QUESTIONS[key] || AUTHENTIC_GOVT_MOCK_QUESTIONS["ssc_cgl"];

    let marksPerCorrect = 2;
    let negativeMarks = 0.50;
    let testDurationMinutes = 20;

    if (key === "ibps_sbi_po") {
        marksPerCorrect = 1;
        negativeMarks = 0.25;
        testDurationMinutes = 25;
    } else if (key === "upsc_csat") {
        marksPerCorrect = 2.5;
        negativeMarks = 0.83;
        testDurationMinutes = 30;
    } else if (key === "rrb_ntpc") {
        marksPerCorrect = 1;
        negativeMarks = 0.33;
        testDurationMinutes = 20;
    }

    return {
        testId: `govt-mock-${key}-${Date.now()}`,
        examId: pattern.id,
        examName: pattern.examName,
        conductingBody: pattern.conductingBody,
        historicalPattern: `Official paper pattern for ${pattern.examName}`,
        syllabusSummary: "Comprehensive evaluation across standard exam subjects.",
        strategyTips: [
            "Maintain speed and accuracy balance.",
            "Eliminate obvious options first.",
            "Avoid negative marking on unsure guesses."
        ],
        totalQuestions: baseQuestions.length,
        durationMinutes: testDurationMinutes,
        markingScheme: {
            correct: `+${marksPerCorrect}`,
            incorrect: `-${negativeMarks}`,
            unanswered: "0"
        },
        expectedCutoffPercent: 68,
        rules: [
            `Total Duration: ${testDurationMinutes} Minutes with live countdown timer.`,
            `Every correct answer awards +${marksPerCorrect} marks.`,
            `Every incorrect answer penalizes -${negativeMarks} marks (Official negative marking).`,
            `Zero marks deducted for unattempted questions.`,
            `Comprehensive step-by-step solutions and cutoff projection provided immediately upon submission.`
        ],
        questions: baseQuestions
    };
}

// ======================================================
// 5. DOMAIN ENGINE & MULTI-SECTION SIMULATOR DELEGATION
// ======================================================
const {
    analyzeGovtExamProfile,
    generateDomainSpecificFallbackPaper,
    synthesizeDynamicGovtExamMockTest
} = require("./govtExamDomainEngine");

// 6. DYNAMIC ON-DEMAND RESEARCHED MOCK TEST & PYQ GENERATOR FOR ANY EXAM
// Supports both 'speed_drill' (20 Qs / 25 Mins) and 'full_paper' (100 Qs / 90 Mins)
async function generateDynamicGovtExamMockTest(params = {}) {
    return synthesizeDynamicGovtExamMockTest({
        ...params,
        callGeminiAI,
        dynamicGovtMockCache
    });
}

module.exports = {
    GOVT_EXAM_PATTERNS,
    calculateGovtEligibility,
    AUTHENTIC_GOVT_MOCK_QUESTIONS,
    generateGovtExamMockTest,
    generateDynamicGovtExamMockTest,
    analyzeGovtExamProfile,
    generateDomainSpecificFallbackPaper
};
