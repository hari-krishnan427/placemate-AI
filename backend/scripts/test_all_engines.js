const fs = require("fs");

// Test each engine independently
async function testEngines() {
    console.log("=== Testing All Job Engines for DocMind AI ===");

    // 1. LinkedIn Guest Stream
    try {
        console.log("\n[1] Testing LinkedIn Guest Stream...");
        const res = await fetch("https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Software&location=India&start=0", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        console.log("LinkedIn Status:", res.status);
    } catch(e) {
        console.error("LinkedIn error:", e.message);
    }

    // 2. Internshala Fresher & Internship Stream
    try {
        console.log("\n[2] Testing Internshala Stream...");
        const res = await fetch("https://internshala.com/fresher-jobs/", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        console.log("Internshala Status:", res.status);
    } catch(e) {
        console.error("Internshala error:", e.message);
    }

    // 3. Freshersworld Tamil Nadu & Indian District Stream
    try {
        console.log("\n[3] Testing Freshersworld Stream...");
        const res = await fetch("https://www.freshersworld.com/jobs/jobsearch/fresher-jobs-in-tamil-nadu", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        console.log("Freshersworld Status:", res.status);
    } catch(e) {
        console.error("Freshersworld error:", e.message);
    }

    // 4. Zoho Recruit Public Boards
    try {
        console.log("\n[4] Testing Zoho Recruit Public Job Board...");
        // Zoho recruit public career portal endpoints
        const res = await fetch("https://careers.zohorecruit.com/recruit/v2/public/Job_Openings", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        console.log("Zoho Recruit Status:", res.status);
    } catch(e) {
        console.error("Zoho Recruit error:", e.message);
    }

    // 5. Schema.org JSON-LD extractor test
    try {
        console.log("\n[5] Testing Schema.org JobPosting parser...");
        const sampleHtml = `
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "JobPosting",
                "title": "Graduate Trainee Engineer",
                "hiringOrganization": { "@type": "Organization", "name": "Precision Engineering Works" },
                "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Coimbatore", "addressRegion": "Tamil Nadu" } },
                "baseSalary": { "@type": "MonetaryAmount", "value": { "minValue": 300000, "maxValue": 500000, "unitText": "YEAR" } },
                "description": "Looking for fresh B.E Mechanical / EEE graduates."
            }
            </script>
        `;
        const jsonMatch = sampleHtml.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1].trim());
            console.log("✅ Schema.org parser successfully extracted:", data.title, "|", data.hiringOrganization.name, "|", data.jobLocation.address.addressLocality);
        }
    } catch(e) {
        console.error("Schema parser error:", e.message);
    }

    // 6. National Career Service (NCS - ncs.gov.in)
    try {
        console.log("\n[6] Testing NCS Ministry of Labour Stream...");
        const res = await fetch("https://www.ncs.gov.in", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            signal: AbortSignal.timeout(5000)
        });
        console.log("NCS Status:", res.status);
    } catch(e) {
        console.warn("NCS notice:", e.message);
    }

    // 7. FreeJobAlert & Sarkari Result (Govt exams)
    try {
        console.log("\n[7] Testing Govt Exam Streams...");
        const res = await fetch("https://www.freejobalert.com/feed", {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        console.log("FreeJobAlert Status:", res.status);
    } catch(e) {
        console.error("Govt stream error:", e.message);
    }
}

testEngines();
