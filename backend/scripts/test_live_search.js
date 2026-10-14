(async () => {
    try {
        const query = "Zoho";
        const location = "Chennai";
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=0`;
        console.log("Fetching LinkedIn guest API:", url);
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });
        console.log("LinkedIn Status:", res.status);
        if (res.ok) {
            const html = await res.text();
            console.log("LinkedIn HTML length:", html.length);
            const titleMatches = [...html.matchAll(/<h3[^>]*class=["'][^"']*base-search-card__title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/gi)];
            const companyMatches = [...html.matchAll(/<h4[^>]*class=["'][^"']*base-search-card__subtitle[^"']*["'][^>]*>([\s\S]*?)<\/h4>/gi)];
            const locMatches = [...html.matchAll(/<span[^>]*class=["'][^"']*job-search-card__location[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
            const linkMatches = [...html.matchAll(/<a[^>]*class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/gi)];

            console.log(`Found ${titleMatches.length} raw jobs on LinkedIn:`);
            for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
                const title = titleMatches[i] ? titleMatches[i][1].trim() : "Role";
                const company = companyMatches[i] ? companyMatches[i][1].replace(/<[^>]*>/g, "").trim() : "Company";
                const loc = locMatches[i] ? locMatches[i][1].trim() : "Location";
                const link = linkMatches[i] ? linkMatches[i][1] : "";
                console.log(` ${i + 1}. ${company}: ${title} (${loc}) -> ${link.substring(0, 40)}...`);
            }
        }
    } catch (e) {
        console.error("LinkedIn fetch error:", e.message);
    }
})();
