(async () => {
    // 4. Freshersworld Indian Fresher Drives
    try {
        console.log("\n4. Testing Freshersworld Jobs...");
        const res = await fetch("https://www.freshersworld.com/jobs/jobsearch/fresher-jobs-in-tamil-nadu", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        console.log("Freshersworld Status:", res.status);
        if (res.ok) {
            const html = await res.text();
            const titles = [...html.matchAll(/<span[^>]*class=["'][^"']*wrap-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
            const companies = [...html.matchAll(/<span[^>]*class=["'][^"']*latest-jobs-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
            console.log(`✅ Freshersworld: Found ${titles.length} jobs in Tamil Nadu.`);
            if (titles.length > 0 && companies.length > 0) {
                console.log(`   Sample: ${companies[0][1].trim()} - ${titles[0][1].trim()}`);
            }
        }
    } catch(e) {
        console.error("Freshersworld error:", e.message);
    }
})();
