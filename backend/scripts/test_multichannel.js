(async () => {
    console.log("=== Testing Multi-Channel Indian Job Streams ===");

    // 1. LinkedIn Guest Stream
    try {
        console.log("\n1. Testing LinkedIn Guest Stream (Tirupur)...");
        const res = await fetch("https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Engineer&location=Tiruppur&start=0", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        if (res.ok) {
            const html = await res.text();
            const titles = [...html.matchAll(/<h3[^>]*class=["'][^"']*base-search-card__title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/gi)];
            console.log(`✅ LinkedIn Tiruppur: Found ${titles.length} live jobs.`);
            if (titles.length > 0) console.log("   Sample:", titles[0][1].trim());
        } else {
            console.log("LinkedIn status:", res.status);
        }
    } catch(e) {
        console.error("LinkedIn error:", e.message);
    }

    // 2. Indeed India Public RSS
    try {
        console.log("\n2. Testing Indeed India Public Stream (Coimbatore)...");
        const res = await fetch("https://in.indeed.com/rss?q=Mechanical&l=Coimbatore", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DocMind-Job-Radar/1.0"
            }
        });
        console.log("Indeed India RSS Status:", res.status);
        if (res.ok) {
            const xml = await res.text();
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
            console.log(`✅ Indeed India: Found ${items.length} items in RSS.`);
        }
    } catch(e) {
        console.error("Indeed error:", e.message);
    }

    // 3. Internshala Search / Open Feed
    try {
        console.log("\n3. Testing Internshala Public Search (India)...");
        const res = await fetch("https://internshala.com/fresher-jobs/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        console.log("Internshala Status:", res.status);
        if (res.ok) {
            const html = await res.text();
            const titles = [...html.matchAll(/class=["'][^"']*job-internship-name[^"']*["'][^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi)];
            const companies = [...html.matchAll(/class=["'][^"']*company-name[^"']*["'][^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi)];
            console.log(`✅ Internshala: Found ${titles.length} live fresher jobs / companies.`);
            if (titles.length > 0 && companies.length > 0) {
                console.log(`   Sample: ${companies[0][1].trim()} - ${titles[0][1].trim()}`);
            }
        }
    } catch(e) {
        console.error("Internshala error:", e.message);
    }
})();
