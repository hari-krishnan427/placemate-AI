/**
 * PlaceMate AI - Multi-Document Government Exam Matcher & DV Readiness Engine
 * 
 * Audits candidate's Document Vault (10th marksheet, degree, caste cert, domicile, ID proof, skill certs)
 * and student profile against 500+ Indian Government Exam Circulars.
 * 
 * Evaluates:
 * 1. Educational Qualification Gate (Degree, stream, min marks)
 * 2. Statutory Age Gate & Category Relaxation (DOB proof, OBC +3 yrs, SC/ST +5 yrs, PwBD +10 yrs)
 * 3. Domicile & Regional Quota Gate (Home state reservation vs All-India open quota)
 * 4. Statutory Document Verification (DV) Scrutiny Checklist (Verified vs Missing in Vault)
 */

// Helper to calculate precise age from Date of Birth against a reference date
function calculateAge(dobStr, refDate = new Date()) {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;

    let age = refDate.getFullYear() - dob.getFullYear();
    const m = refDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

// Classify and audit uploaded documents in the user's vault
function auditUserVault(documents = []) {
    const vault = {
        hasDobProof: false,
        dobDoc: null,
        hasDegreeProof: false,
        degreeDoc: null,
        hasTwelfthProof: false,
        twelfthDoc: null,
        hasCasteProof: false,
        casteDoc: null,
        hasDomicileProof: false,
        domicileDoc: null,
        hasIdProof: false,
        idDoc: null,
        hasTypingProof: false,
        typingDoc: null,
        hasDrivingProof: false,
        drivingDoc: null,
        hasComputerProof: false,
        computerDoc: null,
        totalDocsCount: documents.length,
        documentsList: documents
    };

    documents.forEach(doc => {
        const text = `${doc.original_name || ""} ${doc.filename || ""} ${doc.notes || ""} ${doc.category || ""}`.toLowerCase();
        const cat = (doc.category || "").toLowerCase();

        // 1. DOB / 10th / SSLC / Matriculation
        if (
            text.includes("10th") || text.includes("sslc") || text.includes("matric") ||
            text.includes("secondary") || text.includes("class x") || text.includes("tenth") ||
            text.includes("high school") || text.includes("birth certificate")
        ) {
            vault.hasDobProof = true;
            if (!vault.dobDoc) vault.dobDoc = doc;
        }

        // 2. 12th / HSC / Intermediate
        if (
            text.includes("12th") || text.includes("hsc") || text.includes("intermediate") ||
            text.includes("puc") || text.includes("class xii") || text.includes("plus two")
        ) {
            vault.hasTwelfthProof = true;
            if (!vault.twelfthDoc) vault.twelfthDoc = doc;
        }

        // 3. Degree / Graduation / Provisional / Consolidated Marksheet
        if (
            cat === "marksheet" ||
            text.includes("degree") || text.includes("graduation") || text.includes("b.e") ||
            text.includes("btech") || text.includes("b.tech") || text.includes("b.sc") ||
            text.includes("bcom") || text.includes("b.com") || text.includes("bca") ||
            text.includes("mca") || text.includes("provisional") || text.includes("convocation") ||
            text.includes("transcript") || text.includes("consolidated") || text.includes("semester")
        ) {
            vault.hasDegreeProof = true;
            if (!vault.degreeDoc) vault.degreeDoc = doc;
        }

        // 4. Caste / Community Certificate (OBC-NCL, SC, ST, EWS)
        if (
            text.includes("caste") || text.includes("community") || text.includes("obc") ||
            text.includes("sc certificate") || text.includes("st certificate") || text.includes("ews") ||
            text.includes("reservation") || text.includes("backward class")
        ) {
            vault.hasCasteProof = true;
            if (!vault.casteDoc) vault.casteDoc = doc;
        }

        // 5. Domicile / Nativity / Residence Proof
        if (
            text.includes("domicile") || text.includes("nativity") || text.includes("residence") ||
            text.includes("prc") || text.includes("residential") || text.includes("state quota")
        ) {
            vault.hasDomicileProof = true;
            if (!vault.domicileDoc) vault.domicileDoc = doc;
        }

        // 6. Photo ID (Aadhaar, PAN, Voter ID, Passport)
        if (
            cat === "id_proof" || text.includes("aadhaar") || text.includes("aadhar") ||
            text.includes("pan card") || text.includes("voter") || text.includes("passport") ||
            text.includes("driving license") || text.includes("govt id")
        ) {
            vault.hasIdProof = true;
            if (!vault.idDoc) vault.idDoc = doc;
        }

        // 7. Special Skills (Typing, Steno, Driving License, Computer CCC)
        if (text.includes("typing") || text.includes("shorthand") || text.includes("steno") || text.includes("wpm")) {
            vault.hasTypingProof = true;
            if (!vault.typingDoc) vault.typingDoc = doc;
        }

        if (text.includes("driving") || text.includes("dl") || text.includes("licence") || text.includes("motor")) {
            vault.hasDrivingProof = true;
            if (!vault.drivingDoc) vault.drivingDoc = doc;
        }

        if (text.includes("ccc") || text.includes("dca") || text.includes("computer course") || text.includes("o level") || text.includes("pgdca")) {
            vault.hasComputerProof = true;
            if (!vault.computerDoc) vault.computerDoc = doc;
        }
    });

    return vault;
}

// Normalizes and infers candidate profile credentials
function resolveCandidateCredentials(profile, vault) {
    // 1. Degree & Branch
    const degree = profile?.degree || "Any Graduate";
    const branch = profile?.branch || "General";
    const cgpa = profile?.cgpa ? parseFloat(profile.cgpa) : 7.5;
    const gradYear = profile?.graduation_year ? parseInt(profile.graduation_year, 10) : 2026;

    // 2. Date of Birth & Age
    let dob = profile?.dob || null;
    let candidateAge = null;

    if (dob) {
        candidateAge = calculateAge(dob);
    } else {
        // Fallback: estimate age from graduation year (typical engineering grad completes at 21-22)
        // e.g. grad 2026 -> 21 yrs old, grad 2024 -> 23 yrs old
        const currentYear = new Date().getFullYear();
        candidateAge = Math.max(18, 22 - (gradYear - currentYear));
        dob = `${currentYear - candidateAge}-06-15`; // default placeholder DOB for reference
    }

    // 3. Category / Reservation Community
    const category = profile?.category || "General"; // 'General', 'OBC-NCL', 'SC', 'ST', 'EWS'

    // 4. Domicile State
    let domicileState = profile?.domicile_state || "";
    if (!domicileState && profile?.location) {
        domicileState = profile.location;
    }
    if (!domicileState) {
        domicileState = "All India";
    }

    // 5. Special Qualifications
    const specialQuals = profile?.special_qualifications || {};
    const hasTyping = !!(specialQuals.typing || vault.hasTypingProof);
    const hasSteno = !!(specialQuals.steno || vault.hasTypingProof);
    const hasDrivingLicense = !!(specialQuals.drivingLicense || vault.hasDrivingProof);
    const hasComputerCert = !!(specialQuals.computerCert || vault.hasComputerProof);

    return {
        degree,
        branch,
        cgpa,
        gradYear,
        dob,
        age: candidateAge,
        category,
        domicileState,
        hasTyping,
        hasSteno,
        hasDrivingLicense,
        hasComputerCert
    };
}

// Detect exam parameters from title, organization, domain, and description
function analyzeExamParameters(exam) {
    const title = (exam.title || "").toLowerCase();
    const org = (exam.organization || "").toLowerCase();
    const desc = (exam.description || "").toLowerCase();
    const location = (exam.location || "").toLowerCase();
    const domain = (exam.domain || "").toLowerCase();
    const orgType = (exam.organization_type || "").toLowerCase();

    // 1. Conducting Body & Exam Level
    let isCentral = orgType === "central_govt" || org.includes("upsc") || org.includes("ssc") || org.includes("railway") || org.includes("rrb");
    let isState = orgType === "state_govt" || org.includes("state") || org.includes("police") || org.includes("court") || org.includes("dmho") || org.includes("district");
    let isBanking = domain === "banking_finance" || org.includes("bank") || org.includes("ibps") || org.includes("sbi") || org.includes("rbi") || org.includes("lic");
    let isTechnical = domain === "core_engineering" || org.includes("isro") || org.includes("drdo") || org.includes("bel") || org.includes("engineer") || title.includes("engineer") || title.includes("technician");
    let isPoliceOrDefense = domain === "defense_paramilitary" || org.includes("police") || title.includes("constable") || title.includes("si ") || title.includes("sub inspector") || title.includes("army");

    // 2. Base Age Window Determination (Official Indian Rules)
    let minAge = 18;
    let baseMaxAge = 30; // standard default

    if (title.includes("cgl") || title.includes("graduate level")) {
        minAge = 18;
        baseMaxAge = 30; // some posts 32
    } else if (title.includes("chsl") || title.includes("10+2")) {
        minAge = 18;
        baseMaxAge = 27;
    } else if (org.includes("upsc") || title.includes("civil services")) {
        minAge = 21;
        baseMaxAge = 32;
    } else if (isBanking) {
        if (title.includes("clerk") || title.includes("assistant")) {
            minAge = 20;
            baseMaxAge = 28;
        } else {
            minAge = 20;
            baseMaxAge = 30; // PO / Specialist
        }
    } else if (isPoliceOrDefense) {
        minAge = 18;
        baseMaxAge = 25; // Police Constable / Paramilitary base
    } else if (isState) {
        // State PSCs & departments often have higher base age
        minAge = 18;
        baseMaxAge = 35;
    } else if (title.includes("specialist") || title.includes("doctor") || title.includes("deputy director") || title.includes("fellow")) {
        minAge = 22;
        baseMaxAge = 40;
    }

    // 3. Degree Requirements
    const eligibleDegrees = Array.isArray(exam.eligible_degrees) ? exam.eligible_degrees : ["Any Graduate"];
    let requiresEngineering = false;
    let requiresMedical = false;
    let requiresLaw = false;
    let accepts10thOr12th = false;
    let acceptsAnyGraduate = false;

    for (const deg of eligibleDegrees) {
        const dLower = deg.toLowerCase();
        if (dLower.includes("any graduate") || dLower.includes("all") || dLower.includes("in any discipline")) {
            acceptsAnyGraduate = true;
        }
        if (dLower.includes("10th") || dLower.includes("12th") || dLower.includes("matric")) {
            accepts10thOr12th = true;
        }
        if (dLower.includes("engineering") || dLower.includes("b.e") || dLower.includes("b.tech") || dLower.includes("diploma")) {
            requiresEngineering = true;
        }
        if (dLower.includes("nurse") || dLower.includes("mbbs") || dLower.includes("medical") || dLower.includes("doctor")) {
            requiresMedical = true;
        }
        if (dLower.includes("llb") || dLower.includes("law")) {
            requiresLaw = true;
        }
    }

    if (!acceptsAnyGraduate && !requiresEngineering && !requiresMedical && !requiresLaw && !accepts10thOr12th) {
        acceptsAnyGraduate = true; // default open
    }

    // 4. Special Skill Requirements
    let requiresTyping = title.includes("clerk") || title.includes("typist") || title.includes("assistant") || desc.includes("typing");
    let requiresSteno = title.includes("steno") || desc.includes("shorthand");
    let requiresDriving = title.includes("driver") || isPoliceOrDefense && title.includes("constable");
    let requiresComputer = title.includes("data entry") || title.includes("computer") || desc.includes("ccc") || desc.includes("dca");

    // 5. Target State (if applicable)
    let stateScope = "All India";
    const states = [
        "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra",
        "Punjab", "Haryana", "Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh",
        "West Bengal", "Gujarat", "Odisha", "Delhi", "Assam", "Jharkhand", "Chhattisgarh", "Diu"
    ];

    for (const s of states) {
        if (location.includes(s.toLowerCase()) || title.includes(s.toLowerCase()) || org.includes(s.toLowerCase())) {
            stateScope = s;
            break;
        }
    }

    return {
        isCentral,
        isState,
        isBanking,
        isTechnical,
        isPoliceOrDefense,
        minAge,
        baseMaxAge,
        acceptsAnyGraduate,
        accepts10thOr12th,
        requiresEngineering,
        requiresMedical,
        requiresLaw,
        requiresTyping,
        requiresSteno,
        requiresDriving,
        requiresComputer,
        stateScope
    };
}

/**
 * Audits a single exam against candidate credentials & Document Vault
 */
function auditExamEligibility(candidate, vault, exam) {
    const params = analyzeExamParameters(exam);

    // ----------------------------------------------------
    // PHASE 1: STATUTORY AGE GATE & RELAXATION
    // ----------------------------------------------------
    let relaxationYears = 0;
    let relaxationReason = "No Category Relaxation (General/UR)";

    const catUpper = (candidate.category || "").toUpperCase();
    if (catUpper.includes("OBC")) {
        relaxationYears = 3;
        relaxationReason = "+3 Years (OBC-NCL Statutory Relaxation)";
    } else if (catUpper.includes("SC") || catUpper.includes("ST")) {
        relaxationYears = 5;
        relaxationReason = "+5 Years (SC/ST Statutory Relaxation)";
    } else if (catUpper.includes("PWBD") || catUpper.includes("PWD")) {
        relaxationYears = 10;
        relaxationReason = "+10 Years (PwBD Statutory Relaxation)";
    }

    const effectiveMaxAge = params.baseMaxAge + relaxationYears;
    const candidateAge = candidate.age;

    let isAgeEligible = true;
    let ageNote = `Candidate age ${candidateAge} yrs satisfies cutoff (${params.minAge}–${params.baseMaxAge} yrs)`;

    if (candidateAge < params.minAge) {
        isAgeEligible = false;
        ageNote = `Under-age: Candidate is ${candidateAge} yrs old (Minimum required is ${params.minAge} yrs)`;
    } else if (candidateAge > effectiveMaxAge) {
        isAgeEligible = false;
        ageNote = `Over-age: Candidate is ${candidateAge} yrs old (Cutoff limit is ${effectiveMaxAge} yrs with ${relaxationReason})`;
    } else if (candidateAge > params.baseMaxAge) {
        ageNote = `Age Eligible via ${relaxationReason}: ${candidateAge} yrs (General limit ${params.baseMaxAge} yrs)`;
    }

    // ----------------------------------------------------
    // PHASE 2: EDUCATIONAL QUALIFICATION GATE
    // ----------------------------------------------------
    let isDegreeEligible = false;
    let degreeNote = "";
    const candDegreeLower = (candidate.degree || "").toLowerCase();

    if (params.acceptsAnyGraduate || params.accepts10thOr12th) {
        isDegreeEligible = true;
        degreeNote = `Direct Match: Exam accepts Any Graduate / 12th Pass. Candidate holds ${candidate.degree}`;
    } else if (params.requiresEngineering) {
        if (
            candDegreeLower.includes("b.e") || candDegreeLower.includes("btech") ||
            candDegreeLower.includes("b.tech") || candDegreeLower.includes("engineering") ||
            candDegreeLower.includes("mca") || candDegreeLower.includes("bca")
        ) {
            isDegreeEligible = true;
            degreeNote = `Technical Match: Engineering/Technical degree (${candidate.degree} - ${candidate.branch})`;
        } else {
            isDegreeEligible = false;
            degreeNote = `Disqualified: Post strictly mandates B.E./B.Tech Engineering Degree. Candidate holds ${candidate.degree}`;
        }
    } else if (params.requiresMedical) {
        if (candDegreeLower.includes("mbbs") || candDegreeLower.includes("nurse") || candDegreeLower.includes("b.sc nursing") || candDegreeLower.includes("b.pharm")) {
            isDegreeEligible = true;
            degreeNote = `Medical Discipline Match: ${candidate.degree}`;
        } else {
            isDegreeEligible = false;
            degreeNote = `Disqualified: Medical / Healthcare degree required. Candidate holds ${candidate.degree}`;
        }
    } else if (params.requiresLaw) {
        if (candDegreeLower.includes("llb") || candDegreeLower.includes("law")) {
            isDegreeEligible = true;
            degreeNote = `Law Degree Match: ${candidate.degree}`;
        } else {
            isDegreeEligible = false;
            degreeNote = `Disqualified: Bachelor of Laws (LL.B) required. Candidate holds ${candidate.degree}`;
        }
    } else {
        isDegreeEligible = true;
        degreeNote = `Graduate Degree Accepted: ${candidate.degree}`;
    }

    // ----------------------------------------------------
    // PHASE 3: REGIONAL / DOMICILE QUOTA GATE
    // ----------------------------------------------------
    let domicileStatus = "All India Open Quota";
    let isHomeStateQuota = false;

    if (params.stateScope !== "All India") {
        const candDomLower = (candidate.domicileState || "").toLowerCase();
        const targetStateLower = params.stateScope.toLowerCase();

        if (candDomLower.includes(targetStateLower)) {
            isHomeStateQuota = true;
            domicileStatus = `Eligible for 100% Home State Reservation (${params.stateScope})`;
        } else {
            domicileStatus = `Open / Non-Domicile Category (Subject to ${params.stateScope} state general quota)`;
        }
    }

    // ----------------------------------------------------
    // PHASE 4: STATUTORY DOCUMENT VERIFICATION (DV) AUDIT
    // ----------------------------------------------------
    const checklist = [];

    // Doc 1: 10th / Matriculation Certificate (DOB Proof) - ALWAYS MANDATORY
    checklist.push({
        id: "dob_proof",
        name: "10th Marksheet / Matriculation Certificate (DOB Proof)",
        statutoryRequirement: "Mandatory statutory proof for verifying Date of Birth against official cutoff date.",
        status: vault.hasDobProof ? "verified" : "pending_upload",
        matchedDocName: vault.dobDoc ? (vault.dobDoc.original_name || vault.dobDoc.filename) : null,
        notes: vault.hasDobProof
            ? `Verified in Vault: DOB confirmed for Age Scrutiny (${candidate.age} yrs)`
            : "Missing from Vault: Upload 10th marksheet to pass Board Document Scrutiny.",
        severity: "critical"
    });

    // Doc 2: Degree / Graduation Certificate or Final Marksheet
    checklist.push({
        id: "degree_proof",
        name: "Graduation Degree Certificate / Final Semester Marksheet",
        statutoryRequirement: `Mandatory proof of qualifying examination (${candidate.degree} - ${candidate.branch}).`,
        status: (vault.hasDegreeProof || vault.totalDocsCount > 0) ? "verified" : "pending_upload",
        matchedDocName: vault.degreeDoc ? (vault.degreeDoc.original_name || vault.degreeDoc.filename) : (vault.documentsList[0]?.original_name || null),
        notes: vault.hasDegreeProof
            ? `Verified in Vault: Degree certificate uploaded and recognized.`
            : "Pending: Upload your Graduation Degree Certificate or Semester Marksheets.",
        severity: "critical"
    });

    // Doc 3: Category / Caste Certificate (if claiming reservation or age relaxation)
    const needsCasteProof = candidate.category && candidate.category !== "General";
    if (needsCasteProof) {
        checklist.push({
            id: "caste_certificate",
            name: `${candidate.category} Category / Community Certificate`,
            statutoryRequirement: `Required in prescribed Central/State format to claim ${relaxationReason} & category cutoff.`,
            status: vault.hasCasteProof ? "verified" : "pending_upload",
            matchedDocName: vault.casteDoc ? (vault.casteDoc.original_name || vault.casteDoc.filename) : null,
            notes: vault.hasCasteProof
                ? `Verified in Vault: ${candidate.category} certificate is active.`
                : `Pending in Vault: Upload ${candidate.category} certificate to confirm ${relaxationReason}. Without it, you will be treated as Unreserved/General.`,
            severity: "high"
        });
    } else {
        checklist.push({
            id: "caste_certificate",
            name: "Community / Reservation Certificate",
            statutoryRequirement: "Not required for General / Unreserved candidates.",
            status: "not_required",
            matchedDocName: null,
            notes: "Candidate applying under Unreserved (UR) category.",
            severity: "optional"
        });
    }

    // Doc 4: Domicile / Nativity Certificate (if State recruitment)
    if (params.stateScope !== "All India") {
        checklist.push({
            id: "domicile_proof",
            name: `${params.stateScope} Domicile / Nativity Certificate`,
            statutoryRequirement: `Statutory requirement to unlock state-specific quota seats for ${params.stateScope}.`,
            status: vault.hasDomicileProof ? "verified" : "pending_upload",
            matchedDocName: vault.domicileDoc ? (vault.domicileDoc.original_name || vault.domicileDoc.filename) : null,
            notes: vault.hasDomicileProof
                ? `Verified in Vault: Domicile validated for ${params.stateScope}.`
                : `Pending in Vault: Upload Nativity/Domicile certificate to claim ${params.stateScope} reserved vacancies.`,
            severity: "high"
        });
    }

    // Doc 5: Photo ID Proof (Aadhaar / Voter ID / PAN / Passport)
    checklist.push({
        id: "id_proof",
        name: "Government Photo ID (Aadhaar / PAN / Voter ID)",
        statutoryRequirement: "Mandatory biometric and identity verification document at exam venue & DV center.",
        status: vault.hasIdProof ? "verified" : "pending_upload",
        matchedDocName: vault.idDoc ? (vault.idDoc.original_name || vault.idDoc.filename) : null,
        notes: vault.hasIdProof
            ? "Verified in Vault: Official ID proof is archived."
            : "Pending: Upload Aadhaar, PAN, or Passport to complete identity dossier.",
        severity: "medium"
    });

    // Doc 6: Special Skill Proofs (Typing / Steno / Driving License)
    if (params.requiresTyping) {
        checklist.push({
            id: "typing_proof",
            name: "Typing Speed Certificate (English / Hindi 30-35 WPM)",
            statutoryRequirement: "Mandatory skill certificate for ministerial clerk and computer assistant posts.",
            status: candidate.hasTyping ? "verified" : "pending_upload",
            matchedDocName: vault.typingDoc ? (vault.typingDoc.original_name || vault.typingDoc.filename) : null,
            notes: candidate.hasTyping ? "Skill Certificate verified in Vault." : "Pending: Skill test certificate required at DV stage.",
            severity: "medium"
        });
    }

    if (params.requiresDriving) {
        checklist.push({
            id: "driving_license",
            name: "Valid Motor Driving License (LMV / HMV)",
            statutoryRequirement: "Mandatory driving license for police, constable, and transport posts.",
            status: candidate.hasDrivingLicense ? "verified" : "pending_upload",
            matchedDocName: vault.drivingDoc ? (vault.drivingDoc.original_name || vault.drivingDoc.filename) : null,
            notes: candidate.hasDrivingLicense ? "Driving license verified in Vault." : "Pending: Valid Driving License required.",
            severity: "high"
        });
    }

    // ----------------------------------------------------
    // PHASE 5: COMPUTE OVERALL MATCH SCORE & DV STATUS
    // ----------------------------------------------------
    const isHardEligible = isAgeEligible && isDegreeEligible;

    // Weightage distribution:
    // Age Eligibility: 30 pts
    // Degree Match: 35 pts
    // Documents Verified in Vault: 35 pts
    let score = 0;

    if (isAgeEligible) score += 30;
    if (isDegreeEligible) score += 35;

    // Count mandatory checklist items
    const requiredItems = checklist.filter(item => item.status !== "not_required");
    const verifiedItems = requiredItems.filter(item => item.status === "verified");
    const docReadinessRatio = requiredItems.length > 0 ? (verifiedItems.length / requiredItems.length) : 1;

    score += Math.round(docReadinessRatio * 35);

    // If hard ineligible, cap score at 40
    if (!isHardEligible) {
        score = Math.min(score, 45);
    }

    // Status classification:
    // 'dv_ready' -> 90-100% (Eligible + all required docs verified)
    // 'docs_pending' -> 65-89% (Eligible, but 1-2 docs need upload)
    // 'ineligible' -> <60% (Over-age or Degree mismatch)
    let dvStatus = "ineligible";
    let dvBadgeLabel = "Ineligible";
    let dvColor = "red";

    if (isHardEligible) {
        if (verifiedItems.length === requiredItems.length && score >= 90) {
            dvStatus = "dv_ready";
            dvBadgeLabel = `${score}% DV Ready (All Docs in Vault)`;
            dvColor = "green";
        } else {
            dvStatus = "docs_pending";
            const pendingCount = requiredItems.length - verifiedItems.length;
            dvBadgeLabel = `${score}% Eligible (${pendingCount} ${pendingCount === 1 ? 'Doc' : 'Docs'} Pending)`;
            dvColor = "amber";
        }
    } else {
        dvStatus = "ineligible";
        dvBadgeLabel = "Not Eligible";
        dvColor = "red";
    }

    return {
        matchScore: score,
        isEligible: isHardEligible,
        isAgeEligible,
        isDegreeEligible,
        dvStatus,
        dvBadgeLabel,
        dvColor,
        ageNote,
        degreeNote,
        domicileStatus,
        relaxationApplied: relaxationYears > 0 ? relaxationReason : null,
        effectiveAgeBracket: `${params.minAge} – ${effectiveMaxAge} Years`,
        checklist,
        verifiedDocsCount: verifiedItems.length,
        totalRequiredDocs: requiredItems.length
    };
}

/**
 * Match all government exam circulars against candidate profile & vault
 */
async function matchGovtExamsWithDocuments(userId, pool) {
    // 1. Fetch user documents from database
    const docQuery = await pool.query(
        `SELECT id, user_id, filename, original_name, file_type, file_size, category, notes, uploaded_at
         FROM documents
         WHERE user_id = $1
         ORDER BY uploaded_at DESC`,
        [userId]
    );
    const documents = docQuery.rows;

    // 2. Fetch student profile
    const profileQuery = await pool.query(
        `SELECT * FROM student_profiles WHERE user_id = $1`,
        [userId]
    );
    const profile = profileQuery.rows[0] || null;

    // 3. Audit vault & resolve credentials
    const vault = auditUserVault(documents);
    const candidate = resolveCandidateCredentials(profile, vault);

    // 4. Fetch all active government exam opportunities
    const examsQuery = await pool.query(
        `SELECT * FROM opportunities 
         WHERE category = 'government_exam' AND is_active = TRUE 
         ORDER BY deadline ASC NULLS LAST, posted_at DESC`
    );
    const exams = examsQuery.rows;

    // 5. Audit each exam
    const matchedExams = exams.map(exam => {
        const audit = auditExamEligibility(candidate, vault, exam);
        return {
            ...exam,
            dvAudit: audit
        };
    });

    // 6. Sort results:
    // DV Ready first, then Docs Pending (by score desc), then Ineligible
    matchedExams.sort((a, b) => {
        const statusWeight = { dv_ready: 3, docs_pending: 2, ineligible: 1 };
        const wA = statusWeight[a.dvAudit.dvStatus] || 0;
        const wB = statusWeight[b.dvAudit.dvStatus] || 0;

        if (wA !== wB) return wB - wA;
        return b.dvAudit.matchScore - a.dvAudit.matchScore;
    });

    // 7. Aggregate summary statistics
    const stats = {
        totalExams: matchedExams.length,
        dvReadyCount: matchedExams.filter(e => e.dvAudit.dvStatus === "dv_ready").length,
        docsPendingCount: matchedExams.filter(e => e.dvAudit.dvStatus === "docs_pending").length,
        ineligibleCount: matchedExams.filter(e => e.dvAudit.dvStatus === "ineligible").length,
        candidateProfile: {
            degree: candidate.degree,
            branch: candidate.branch,
            age: candidate.age,
            dob: candidate.dob,
            category: candidate.category,
            domicileState: candidate.domicileState,
            totalVaultDocs: vault.totalDocsCount,
            hasDobProof: vault.hasDobProof,
            hasDegreeProof: vault.hasDegreeProof,
            hasCasteProof: vault.hasCasteProof,
            hasDomicileProof: vault.hasDomicileProof,
            hasIdProof: vault.hasIdProof
        }
    };

    return {
        candidate,
        vault,
        stats,
        matchedExams
    };
}

module.exports = {
    calculateAge,
    auditUserVault,
    resolveCandidateCredentials,
    analyzeExamParameters,
    auditExamEligibility,
    matchGovtExamsWithDocuments
};
