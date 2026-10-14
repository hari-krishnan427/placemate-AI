const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'student_db', password: '2006', port: 5432 });

(async () => {
    try {
        const countRes = await pool.query("SELECT COUNT(*) FROM opportunities WHERE category = 'government_exam'");
        console.log("Total govt exams:", countRes.rows[0].count);

        const sample = await pool.query("SELECT id, title, organization, organization_type, eligible_degrees, exam_stages, deadline, apply_url FROM opportunities WHERE category = 'government_exam' LIMIT 10");
        console.log("Sample exams:", JSON.stringify(sample.rows, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await pool.end();
    }
})();
