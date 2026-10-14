require('dotenv').config();
const { Pool } = require('pg');
const fetcher = require('../liveJobFetcher');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'student_db',
    password: process.env.DB_PASSWORD || '2006',
    port: 5432
});

async function run() {
    console.log("1. Purging obsolete opportunity rows for fresh uncapped sync...");
    await pool.query("DELETE FROM opportunities");

    console.log("2. Running 100% Uncapped All-Stream Live Internet Ingestion...");
    const res = await fetcher.syncLiveOpportunitiesFromWeb(pool);
    console.log("Sync output:", res);

    console.log("\n3. Active Opportunities by Academic Domain:");
    const domains = await pool.query("SELECT domain, count(*) FROM opportunities GROUP BY domain ORDER BY count DESC");
    console.table(domains.rows);

    console.log("\n4. Active Opportunities by Category:");
    const cats = await pool.query("SELECT category, count(*) FROM opportunities GROUP BY category ORDER BY count DESC");
    console.table(cats.rows);

    console.log("\n5. Active Opportunities by Location:");
    const locs = await pool.query("SELECT location, count(*) FROM opportunities GROUP BY location ORDER BY count DESC LIMIT 15");
    console.table(locs.rows);

    console.log("\n6. Sample Opportunities Across Disciplines:");
    const sample = await pool.query("SELECT title, organization, domain, location, eligible_degrees FROM opportunities ORDER BY id DESC LIMIT 10");
    console.log(JSON.stringify(sample.rows, null, 2));

    await pool.end();
}

run().catch(err => {
    console.error("Run error:", err);
    process.exit(1);
});
