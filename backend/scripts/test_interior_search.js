(async () => {
    const tests = [
        { q: "Mechanical Engineer", loc: "Coimbatore" },
        { q: "Production Engineer", loc: "Tirupur" },
        { q: "Civil Engineer", loc: "Salem" },
        { q: "Java Developer", loc: "Erode" }
    ];

    for (const t of tests) {
        try {
            const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(t.q)}&location=${encodeURIComponent(t.loc)}&start=0`;
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }
            });
            if (res.ok) {
                const html = await res.text();
                const titleMatches = [...html.matchAll(/<h3[^>]*class=["'][^"']*base-search-card__title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/gi)];
                const companyMatches = [...html.matchAll(/<h4[^>]*class=["'][^"']*base-search-card__subtitle[^"']*["'][^>]*>([\s\S]*?)<\/h4>/gi)];
                const locMatches = [...html.matchAll(/<span[^>]*class=["'][^"']*job-search-card__location[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
                console.log(`\n=== Results for "${t.q}" in ${t.loc} (${titleMatches.length} found): ===`);
                for (let i = 0; i < Math.min(titleMatches.length, 3); i++) {
                    const title = titleMatches[i] ? titleMatches[i][1].trim() : "Role";
                    const company = companyMatches[i] ? companyMatches[i][1].replace(/<[^>]*>/g, "").trim() : "Company";
                    const loc = locMatches[i] ? locMatches[i][1].trim() : "Location";
                    console.log(` - ${company}: ${title} (${loc})`);
                }
            } else {
                console.log(`Failed for ${t.loc}: status ${res.status}`);
            }
        } catch(e) {
            console.error(e.message);
        }
    }
})();
