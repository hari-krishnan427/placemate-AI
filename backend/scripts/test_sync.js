const { Pool } = require('pg');
const fetcher = require('../liveJobFetcher');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'student_db', password: '2006', port: 5432 });

(async () => {
    try {
        console.log('Running syncLiveOpportunitiesFromWeb...');
        const res = await fetcher.syncLiveOpportunitiesFromWeb(pool);
        console.log('Sync result:', res);
        const latestJobs = await pool.query(
            "SELECT title, organization, posted_at, category FROM opportunities WHERE category != 'government_exam' ORDER BY posted_at DESC LIMIT 5"
        );
        console.log('Latest 5 jobs in DB:');
        latestJobs.rows.forEach(r => console.log(' -', r.title, '|', r.posted_at));
    } catch(e) {
        console.error('Error during sync:', e);
    } finally {
        pool.end();
    }
})();
