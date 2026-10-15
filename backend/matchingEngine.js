/**
 * PlaceMate AI - Career Matching Engine (Version 3)
 * 
 * Intelligent two-phase matching algorithm:
 * Phase 1: Hard Eligibility Gatekeeper (Degree, Branch, Graduation Year, CGPA)
 * Phase 2: Dynamic Skill Overlap, Alias Normalization & Skill Gap Detection
 */

// Skill aliases map to normalize variations across all student disciplines
const SKILL_ALIASES = {
    // Software & Web
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",
    "express": "express.js",
    "expressjs": "express.js",
    "express.js": "express.js",
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "py": "python",
    "python": "python",
    "cpp": "c++",
    "c++": "c++",
    "c#": "c#",
    "csharp": "c#",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "psql": "postgresql",
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "git": "git",
    "github": "git",
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "html": "html5",
    "html5": "html5",
    "css": "css3",
    "css3": "css3",
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",
    "sql": "sql",
    "mysql": "mysql",
    "data structures": "dsa",
    "dsa": "dsa",
    "algorithms": "dsa",
    "rest api": "rest apis",
    "rest apis": "rest apis",
    "restful": "rest apis",

    // Core Engineering (Mechanical, Civil, EEE, ECE, Auto)
    "autocad": "cad",
    "cad": "cad",
    "solidworks": "cad",
    "catia": "cad",
    "ansys": "fea",
    "fea": "fea",
    "matlab": "matlab",
    "manufacturing": "manufacturing",
    "production": "manufacturing",
    "quality control": "quality control",
    "qa/qc": "quality control",
    "quality inspection": "quality control",
    "six sigma": "quality control",
    "plc": "industrial automation",
    "scada": "industrial automation",
    "embedded": "embedded systems",
    "embedded systems": "embedded systems",
    "site supervision": "site engineering",
    "site engineer": "site engineering",
    "structural analysis": "site engineering",

    // Commerce & Finance (B.Com, BBA, MBA, M.Com)
    "tally": "tally erp",
    "tally erp": "tally erp",
    "tally erp 9": "tally erp",
    "tally prime": "tally erp",
    "accounting": "financial accounting",
    "financial accounting": "financial accounting",
    "auditing": "auditing",
    "audit": "auditing",
    "taxation": "taxation & gst",
    "tax": "taxation & gst",
    "gst": "taxation & gst",
    "tds": "taxation & gst",
    "banking": "banking operations",
    "banking operations": "banking operations",
    "financial analysis": "financial analysis",

    // Arts, Science & General Graduates (B.Sc, BA, Operations)
    "excel": "ms excel",
    "ms excel": "ms excel",
    "advanced excel": "ms excel",
    "spreadsheets": "ms excel",
    "communication": "communication skills",
    "communication skills": "communication skills",
    "english communication": "communication skills",
    "customer service": "customer relations",
    "customer relations": "customer relations",
    "client handling": "customer relations",
    "problem solving": "problem solving",
    "analytical thinking": "problem solving"
};

/**
 * Normalize skill name to canonical form
 */
function normalizeSkill(skill) {
    if (!skill || typeof skill !== "string") return "";
    const clean = skill.trim().toLowerCase();
    return SKILL_ALIASES[clean] || clean;
}

/**
 * Match a single opportunity against a student profile
 * 
 * @param {Object} profile - Student profile from database
 * @param {Object} opportunity - Opportunity record from database
 * @returns {Object} Match analysis result
 */
function matchOpportunity(profile, opportunity) {
    // If student has no profile at all
    if (!profile) {
        return {
            matchScore: 0,
            isEligible: true,
            hasProfile: false,
            matchedSkills: [],
            skillGaps: opportunity.required_skills || [],
            eligibilityNotes: ["Upload resume to calculate exact match"],
            ineligibilityReasons: [],
            priorityLevel: "medium"
        };
    }

    const ineligibilityReasons = [];
    const eligibilityNotes = [];

    // ----------------------------------------------------
    // PHASE 1: HARD ELIGIBILITY GATEKEEPER
    // ----------------------------------------------------

    // 1. Graduation Year Check
    const eligibleYears = Array.isArray(opportunity.eligible_years) 
        ? opportunity.eligible_years 
        : [];
    
    if (eligibleYears.length > 0 && profile.graduation_year) {
        const studentYear = parseInt(profile.graduation_year, 10);
        const isYearAllowed = eligibleYears.some(y => parseInt(y, 10) === studentYear);
        if (!isYearAllowed) {
            ineligibilityReasons.push(
                `Batch Mismatch: Eligible for [${eligibleYears.join(", ")}], but your batch is ${studentYear}`
            );
        } else {
            eligibilityNotes.push(`Batch ${studentYear} is eligible`);
        }
    }

    // 2. Minimum CGPA / Percentage Cutoff Check
    const minCgpa = parseFloat(opportunity.min_cgpa) || 0;
    if (minCgpa > 0 && profile.cgpa) {
        const studentCgpa = parseFloat(profile.cgpa);
        if (studentCgpa < minCgpa) {
            ineligibilityReasons.push(
                `CGPA Cutoff: Requires min ${minCgpa} CGPA (Your CGPA: ${studentCgpa})`
            );
        } else {
            eligibilityNotes.push(`CGPA ${studentCgpa} meets min cutoff (${minCgpa})`);
        }
    }

    // 3. Degree / Qualification Check
    const eligibleDegrees = Array.isArray(opportunity.eligible_degrees) 
        ? opportunity.eligible_degrees.map(d => d.toLowerCase()) 
        : [];
    
    const isDegreeUniversal = eligibleDegrees.length === 0 || 
        eligibleDegrees.includes("all") || 
        eligibleDegrees.includes("any graduate") ||
        eligibleDegrees.some(d => d.includes("any graduate") || d.includes("any discipline") || d.includes("any degree") || d.includes("all"));

    if (!isDegreeUniversal && profile.degree) {
        const studentDegree = profile.degree.toLowerCase();
        const matchesDegree = eligibleDegrees.some(deg => 
            studentDegree.includes(deg) || deg.includes(studentDegree)
        );
        if (!matchesDegree) {
            ineligibilityReasons.push(
                `Degree Criteria: Requires ${opportunity.eligible_degrees.join(", ")} (Your degree: ${profile.degree})`
            );
        } else {
            eligibilityNotes.push(`Degree (${profile.degree}) is eligible`);
        }
    }

    const isEligible = ineligibilityReasons.length === 0;

    // ----------------------------------------------------
    // PHASE 2: SKILL MATCHING & GAP DETECTION
    // ----------------------------------------------------

    const studentSkillsRaw = Array.isArray(profile.skills) ? profile.skills : [];
    const studentNormalized = new Set(studentSkillsRaw.map(s => normalizeSkill(s)));

    const requiredSkillsRaw = Array.isArray(opportunity.required_skills) 
        ? opportunity.required_skills 
        : [];

    const matchedSkills = [];
    const skillGaps = [];

    requiredSkillsRaw.forEach(reqSkill => {
        const norm = normalizeSkill(reqSkill);
        if (studentNormalized.has(norm)) {
            matchedSkills.push(reqSkill);
        } else {
            skillGaps.push(reqSkill);
        }
    });

    let matchScore = 0;

    if (opportunity.category === "government_exam") {
        // Government exams rely predominantly on eligibility (Degree + Age/Batch)
        // rather than corporate programming skills
        if (isEligible) {
            matchScore = 95;
            eligibilityNotes.push("Meets all official educational & notification criteria");
        } else {
            matchScore = 30;
        }
    } else {
        // Corporate Jobs & Internships
        if (requiredSkillsRaw.length === 0) {
            matchScore = isEligible ? 85 : 40;
        } else {
            const rawScore = (matchedSkills.length / requiredSkillsRaw.length) * 100;
            matchScore = Math.round(rawScore);
        }

        // Branch & Domain Alignment Boost for all student disciplines
        if (isEligible && profile.branch) {
            const branchLower = (profile.branch || "").toLowerCase();
            const degreeLower = (profile.degree || "").toLowerCase();
            const oppDomain = (opportunity.domain || "").toLowerCase();

            // Core Engineering Alignment (Mechanical, Civil, EEE, ECE, Auto)
            if (
                oppDomain === "core_engineering" && 
                (branchLower.includes("mech") || branchLower.includes("civil") || branchLower.includes("electr") || branchLower.includes("eee") || branchLower.includes("ece") || branchLower.includes("auto"))
            ) {
                matchScore = Math.min(100, Math.max(matchScore, 85));
                eligibilityNotes.push(`Direct core branch alignment with ${profile.branch}`);
            }

            // Commerce & Business Alignment (B.Com, BBA, MBA, M.Com)
            if (
                oppDomain === "commerce_finance" && 
                (degreeLower.includes("b.com") || degreeLower.includes("bba") || degreeLower.includes("mba") || branchLower.includes("commerce") || branchLower.includes("finance") || branchLower.includes("account"))
            ) {
                matchScore = Math.min(100, Math.max(matchScore, 88));
                eligibilityNotes.push(`High alignment with ${profile.degree || profile.branch}`);
            }

            // General Graduate Alignment (B.Sc, BA, Operations)
            if (oppDomain === "general_graduate" && isEligible) {
                matchScore = Math.min(100, Math.max(matchScore, 80));
            }

            // Ineligible cap to avoid misleading high scores
            if (!isEligible && matchScore > 50) {
                matchScore = 45;
            }
        }
    }

    // Determine priority level
    let priorityLevel = "low";
    if (matchScore >= 75 && isEligible) {
        priorityLevel = "high";
    } else if (matchScore >= 50 && isEligible) {
        priorityLevel = "medium";
    }

    return {
        matchScore,
        isEligible,
        hasProfile: true,
        matchedSkills,
        skillGaps,
        eligibilityNotes,
        ineligibilityReasons,
        priorityLevel
    };
}

/**
 * Score and sort a list of opportunities for a student profile
 */
function rankOpportunities(profile, opportunities) {
    return opportunities.map(opp => {
        const matchData = matchOpportunity(profile, opp);
        return {
            ...opp,
            match: matchData
        };
    }).sort((a, b) => {
        // 1. Eligible items come first
        if (a.match.isEligible !== b.match.isEligible) {
            return a.match.isEligible ? -1 : 1;
        }
        // 2. Highest match score first
        if (b.match.matchScore !== a.match.matchScore) {
            return b.match.matchScore - a.match.matchScore;
        }
        // 3. Freshest post date first
        const dateA = new Date(a.posted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.posted_at || b.created_at || 0).getTime();
        return dateB - dateA;
    });
}

module.exports = {
    normalizeSkill,
    matchOpportunity,
    rankOpportunities
};
