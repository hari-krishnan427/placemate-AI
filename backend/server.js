require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const multer = require("multer");
const fs = require("fs");
const path = require("path");
const extractor = require("./extractor");
const matchingEngine = require("./matchingEngine");
const liveJobFetcher = require("./liveJobFetcher");
const mentorService = require("./mentorService");
const govtExamService = require("./govtExamService");
const govDocumentMatcher = require("./govDocumentMatcher");
const careerChatService = require("./careerChatService");
const alertService = require("./alertService");
const emailAlertService = require("./emailAlertService");

const app = express();


// ======================================================
// CONSTANTS
// ======================================================

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const VERIFIED_WINDOW_MS = 10 * 60 * 1000;


// ======================================================
// MIDDLEWARE & CORS
// ======================================================

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like health checks, server-to-server)
            if (!origin) return callback(null, true);
            
            if (
                allowedOrigins.includes(origin) ||
                (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) ||
                origin.includes("localhost") ||
                origin.includes("127.0.0.1")
            ) {
                return callback(null, true);
            }
            // Allow with credentials for seamless deployment
            return callback(null, true);
        },
        credentials: true
    })
);

app.use(express.json());

// Health Check Endpoints (for cloud hosts like Render, Railway, AWS)
app.get(["/", "/health", "/api/health"], (req, res) => {
    res.json({
        status: "ok",
        service: "DocMind AI Career Platform API",
        environment: process.env.NODE_ENV || "development",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});


// ======================================================
// DATABASE
// ======================================================

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
          }
        : {
              user: process.env.DB_USER || "postgres",
              host: process.env.DB_HOST || "localhost",
              database: process.env.DB_NAME || "student_db",
              password: process.env.DB_PASSWORD || "2006",
              port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432
          }
);

// Ensure database tables and columns exist
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                file_type VARCHAR(100),
                file_size BIGINT,
                file_path TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'other',
                notes TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;

            CREATE TABLE IF NOT EXISTS student_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                resume_doc_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
                full_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                location VARCHAR(255),
                degree VARCHAR(255),
                branch VARCHAR(255),
                institution VARCHAR(255),
                graduation_year INTEGER,
                cgpa NUMERIC(4, 2),
                skills JSONB DEFAULT '[]'::jsonb,
                experience JSONB DEFAULT '[]'::jsonb,
                projects JSONB DEFAULT '[]'::jsonb,
                certifications JSONB DEFAULT '[]'::jsonb,
                raw_text TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dob DATE;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General';
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS domicile_state VARCHAR(100);
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS special_qualifications JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS alert_email VARCHAR(255);
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN DEFAULT TRUE;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dispatched_email_ids JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255);
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS standing_arrears INTEGER DEFAULT 0;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS preferred_roles JSONB DEFAULT '[]'::jsonb;

            CREATE TABLE IF NOT EXISTS placement_emails (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                recipient_email VARCHAR(255) NOT NULL,
                alert_id VARCHAR(100),
                company VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                html_body TEXT NOT NULL,
                urgency VARCHAR(50) DEFAULT 'critical_24h',
                is_read BOOLEAN DEFAULT FALSE,
                dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS opportunities (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                organization VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                organization_type VARCHAR(50) DEFAULT 'mid_size',
                domain VARCHAR(100) DEFAULT 'software_web',
                location VARCHAR(255) NOT NULL,
                work_mode VARCHAR(50) DEFAULT 'On-site',
                eligible_degrees JSONB DEFAULT '["All"]'::jsonb,
                eligible_branches JSONB DEFAULT '["All"]'::jsonb,
                eligible_years JSONB DEFAULT '[]'::jsonb,
                min_cgpa NUMERIC(4, 2) DEFAULT 0,
                required_skills JSONB DEFAULT '[]'::jsonb,
                salary_or_stipend VARCHAR(100),
                deadline TIMESTAMP,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                apply_url TEXT NOT NULL,
                description TEXT,
                exam_stages JSONB DEFAULT '[]'::jsonb,
                source VARCHAR(100) DEFAULT 'DocMind Live Feed',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database initialized with required tables and columns.");

        // Ensure demo student account exists for frictionless 1-click login
        const demoUserCheck = await pool.query("SELECT id FROM users WHERE email = $1", ["student.demo@docmind.ai"]);
        if (demoUserCheck.rows.length === 0) {
            const demoHash = await bcrypt.hash("docmind2026", 10);
            const uRes = await pool.query(
                "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
                ["student.demo@docmind.ai", demoHash]
            );
            await pool.query(
                `INSERT INTO student_profiles (user_id, full_name, email, degree, branch, institution, graduation_year, cgpa, skills)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (user_id) DO NOTHING`,
                [
                    uRes.rows[0].id,
                    "Demo Student (Final Year)",
                    "student.demo@docmind.ai",
                    "B.E. Computer Science & Engineering",
                    "Computer Science",
                    "Anna University Affiliated College",
                    2026,
                    8.45,
                    JSON.stringify(["JavaScript", "React", "Node.js", "Java", "SQL", "Data Structures", "Algorithms", "Git", "REST APIs", "Python"])
                ]
            );
            console.log("Guaranteed demo student profile seeded for frictionless access.");
        }

        // Fetch live opportunities directly from real internet streams if empty
        const oppCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM opportunities");
        if (oppCountResult.rows[0].count === 0) {
            console.log("Connecting to live internet feeds to fetch real fresher jobs & govt exams...");
            await liveJobFetcher.syncLiveOpportunitiesFromWeb(pool);
        }
    } catch (err) {
        console.error("Database initialization notice:", err.message);
    }
}
initDatabase();



// ======================================================
// SESSION
// IMPORTANT: SESSION MUST COME BEFORE ROUTES
// ======================================================

const isProduction =
    process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(
    session({
        store: new pgSession({
            pool: pool,
            createTableIfMissing: true
        }),

        secret: process.env.SESSION_SECRET,

        name: "docmind.sid",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure: isProduction,

            sameSite: isProduction
                ? "none"
                : "lax",

            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


// ======================================================
// FILE UPLOAD CONFIGURATION
// ======================================================

// Absolute path to backend/uploads
const uploadDir = path.join(__dirname, "uploads");

// Create uploads folder automatically if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadDir);

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);

    }

});


const upload = multer({
    storage: storage
});


// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    pool: true,

    maxConnections: 2,

    maxMessages: 100,

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});


// ======================================================
// OTP STORAGE
// ======================================================

const otpStore = new Map();


// ======================================================
// VERIFIED OTP STORAGE
// ======================================================

const verifiedActions = new Map();


// ======================================================
// HELPER FUNCTIONS
// ======================================================


// Normalize email

function normalizeEmail(email) {

    return email.trim().toLowerCase();

}


// Create OTP key

function getOtpKey(purpose, email) {

    return `${purpose}:${email}`;

}


// Generate secure 6-digit OTP

function generateOTP() {

    return crypto.randomInt(
        100000,
        1000000
    ).toString();

}


// Hash OTP using server-side secret

function hashOTP(otp) {

    return crypto
        .createHmac(
            "sha256",
            process.env.OTP_SECRET
        )
        .update(otp)
        .digest("hex");

}


// Escape HTML

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// OTP EMAIL
// ======================================================

async function sendOTPEmail(email, otp, purpose) {

    const title =
        purpose === "register"
            ? "Verify your DocMind account"
            : "Reset your DocMind password";


    const message =
        purpose === "register"
            ? "Use the verification code below to create your DocMind AI account."
            : "Use the code below to reset your DocMind AI password.";


    await transporter.sendMail({

        from:
            `"DocMind AI" <${process.env.EMAIL_USER}>`,

        to: email,

        subject:
            purpose === "register"
                ? "DocMind AI - Verify Your Email"
                : "DocMind AI - Password Reset OTP",

        text:
            `Your DocMind AI OTP is ${otp}. ` +
            `It expires in 5 minutes.`,

        html: `

<!DOCTYPE html>

<html>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,sans-serif;
">

    <div style="
        max-width:600px;
        margin:40px auto;
        background:white;
        border-radius:12px;
        overflow:hidden;
        box-shadow:0 4px 20px rgba(0,0,0,0.08);
    ">

        <div style="
            background:#111827;
            color:white;
            padding:28px;
            text-align:center;
        ">

            <h1 style="
                margin:0;
                font-size:28px;
            ">
                DocMind AI
            </h1>

            <p style="
                margin:8px 0 0;
                color:#d1d5db;
            ">
                Personal Career Intelligence
            </p>

        </div>


        <div style="
            padding:35px;
        ">

            <h2 style="
                color:#111827;
                margin-top:0;
            ">
                ${escapeHtml(title)}
            </h2>


            <p style="
                color:#4b5563;
                line-height:1.6;
            ">
                ${escapeHtml(message)}
            </p>


            <div style="
                margin:30px 0;
                padding:20px;
                background:#f3f4f6;
                border-radius:10px;
                text-align:center;
            ">

                <p style="
                    margin:0 0 8px;
                    color:#6b7280;
                    font-size:14px;
                ">
                    Your OTP
                </p>


                <div style="
                    font-size:36px;
                    font-weight:bold;
                    letter-spacing:8px;
                    color:#111827;
                ">
                    ${otp}
                </div>

            </div>


            <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.6;
            ">
                This OTP will expire in
                <strong>5 minutes</strong>.
            </p>


            <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.6;
            ">
                If you did not request this,
                you can safely ignore this email.
            </p>

        </div>


        <div style="
            padding:20px;
            background:#f9fafb;
            text-align:center;
            color:#9ca3af;
            font-size:12px;
        ">
            © DocMind AI
        </div>

    </div>

</body>

</html>

        `

    });

}


// ======================================================
// DOCUMENT VAULT ROUTES (VERSION 1)
// ======================================================

// 1. Upload Document
app.post(
    "/documents/upload",
    upload.single("document"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No file uploaded"
                });
            }

            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            // Determine category
            let category = (req.body.category || "").toLowerCase().trim();
            const validCategories = ["resume", "marksheet", "certificate", "id_proof", "other"];
            if (!validCategories.includes(category)) {
                const nameLower = req.file.originalname.toLowerCase();
                if (nameLower.includes("resume") || nameLower.includes("cv")) {
                    category = "resume";
                } else if (
                    nameLower.includes("marksheet") ||
                    nameLower.includes("transcript") ||
                    nameLower.includes("sem") ||
                    nameLower.includes("grade")
                ) {
                    category = "marksheet";
                } else if (
                    nameLower.includes("cert") ||
                    nameLower.includes("course") ||
                    nameLower.includes("badge")
                ) {
                    category = "certificate";
                } else if (
                    nameLower.includes("aadhar") ||
                    nameLower.includes("pan") ||
                    nameLower.includes("passport") ||
                    nameLower.includes("id")
                ) {
                    category = "id_proof";
                } else {
                    category = "other";
                }
            }

            const notes = (req.body.notes || "").trim();

            const result = await pool.query(
                `INSERT INTO documents
                (
                    user_id,
                    filename,
                    original_name,
                    file_type,
                    file_size,
                    file_path,
                    category,
                    notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    userId,
                    req.file.filename,
                    req.file.originalname,
                    req.file.mimetype,
                    req.file.size,
                    req.file.path,
                    category,
                    notes
                ]
            );

            res.status(201).json({
                message: "Document uploaded successfully",
                document: result.rows[0]
            });
        } catch (error) {
            console.error("UPLOAD ERROR:", error);
            res.status(500).json({
                message: "Upload failed: " + error.message
            });
        }
    }
);

// 2. Get User Documents with Filters and Category Stats
app.get(
    "/documents",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const { category, search } = req.query;

            let query = `
                SELECT id, user_id, filename, original_name, file_type, file_size, category, notes, uploaded_at
                FROM documents
                WHERE user_id = $1
            `;
            const params = [userId];

            if (category && category !== "all") {
                params.push(category);
                query += ` AND category = $${params.length}`;
            }

            if (search && search.trim() !== "") {
                params.push(`%${search.trim()}%`);
                query += ` AND (original_name ILIKE $${params.length} OR notes ILIKE $${params.length})`;
            }

            query += ` ORDER BY uploaded_at DESC`;

            const result = await pool.query(query, params);

            // Fetch overall category statistics for this user
            const statsResult = await pool.query(
                `SELECT 
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE category = 'resume')::int AS resume,
                    COUNT(*) FILTER (WHERE category = 'marksheet')::int AS marksheet,
                    COUNT(*) FILTER (WHERE category = 'certificate')::int AS certificate,
                    COUNT(*) FILTER (WHERE category = 'id_proof')::int AS id_proof,
                    COUNT(*) FILTER (WHERE category = 'other')::int AS other
                 FROM documents
                 WHERE user_id = $1`,
                [userId]
            );

            res.json({
                documents: result.rows,
                stats: statsResult.rows[0] || {
                    total: 0,
                    resume: 0,
                    marksheet: 0,
                    certificate: 0,
                    id_proof: 0,
                    other: 0
                }
            });
        } catch (error) {
            console.error("FETCH DOCUMENTS ERROR:", error);
            res.status(500).json({
                message: "Failed to fetch documents"
            });
        }
    }
);

// 3. View / Stream Document Inline (Preview)
app.get(
    "/documents/:id/view",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const docId = parseInt(req.params.id, 10);
            const result = await pool.query(
                `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Document not found"
                });
            }

            const doc = result.rows[0];

            if (!fs.existsSync(doc.file_path)) {
                return res.status(404).json({
                    message: "Physical file not found on server"
                });
            }

            res.setHeader("Content-Type", doc.file_type || "application/octet-stream");
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${encodeURIComponent(doc.original_name || doc.filename)}"`
            );

            const stream = fs.createReadStream(doc.file_path);
            stream.pipe(res);
        } catch (error) {
            console.error("VIEW DOCUMENT ERROR:", error);
            res.status(500).json({
                message: "Failed to load document preview"
            });
        }
    }
);

// 4. Download Document
app.get(
    "/documents/:id/download",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const docId = parseInt(req.params.id, 10);
            const result = await pool.query(
                `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Document not found"
                });
            }

            const doc = result.rows[0];

            if (!fs.existsSync(doc.file_path)) {
                return res.status(404).json({
                    message: "Physical file not found on server"
                });
            }

            res.download(doc.file_path, doc.original_name || doc.filename);
        } catch (error) {
            console.error("DOWNLOAD DOCUMENT ERROR:", error);
            res.status(500).json({
                message: "Failed to download document"
            });
        }
    }
);

// 5. Delete Document
app.delete(
    "/documents/:id",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const docId = parseInt(req.params.id, 10);
            const result = await pool.query(
                `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Document not found"
                });
            }

            const doc = result.rows[0];

            // Delete file from filesystem if present
            if (fs.existsSync(doc.file_path)) {
                try {
                    fs.unlinkSync(doc.file_path);
                } catch (fsErr) {
                    console.error("Failed to delete local file:", fsErr);
                }
            }

            // Delete record from database
            await pool.query(
                `DELETE FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            res.json({
                message: "Document deleted successfully",
                id: docId
            });
        } catch (error) {
            console.error("DELETE DOCUMENT ERROR:", error);
            res.status(500).json({
                message: "Failed to delete document"
            });
        }
    }
);


// ======================================================
// DOCUMENT INTELLIGENCE & RESUME PARSING (VERSION 2)
// ======================================================

// 6. Extract Information from Document & Build Student Profile
app.post(
    "/documents/:id/extract",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const docId = parseInt(req.params.id, 10);
            const docResult = await pool.query(
                `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            if (docResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Document not found"
                });
            }

            const doc = docResult.rows[0];

            console.log(`Starting universal extraction for document ID ${doc.id} (${doc.original_name})...`);

            // Step 1: Universal raw text extraction (PDF, DOCX, TXT, OCR)
            const rawText = await extractor.extractText(
                doc.file_path,
                doc.file_type,
                doc.original_name || doc.filename
            );

            if (!rawText || rawText.trim().length === 0) {
                return res.status(400).json({
                    message: "Could not extract readable text from this document. Please ensure it is not an empty or password-protected file."
                });
            }

            console.log(`Extracted ${rawText.length} characters of raw text. Analyzing with AI...`);

            // Step 2: Intelligent Resume Analysis via Gemini AI (with heuristic fallback)
            const analysis = await extractor.analyzeResumeWithAI(rawText);

            // Step 3: Save / Upsert to PostgreSQL student_profiles
            const upsertResult = await pool.query(
                `INSERT INTO student_profiles (
                    user_id,
                    resume_doc_id,
                    full_name,
                    email,
                    phone,
                    location,
                    degree,
                    branch,
                    institution,
                    graduation_year,
                    cgpa,
                    skills,
                    experience,
                    projects,
                    certifications,
                    raw_text,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET
                    resume_doc_id = EXCLUDED.resume_doc_id,
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    location = EXCLUDED.location,
                    degree = EXCLUDED.degree,
                    branch = EXCLUDED.branch,
                    institution = EXCLUDED.institution,
                    graduation_year = EXCLUDED.graduation_year,
                    cgpa = EXCLUDED.cgpa,
                    skills = EXCLUDED.skills,
                    experience = EXCLUDED.experience,
                    projects = EXCLUDED.projects,
                    certifications = EXCLUDED.certifications,
                    raw_text = EXCLUDED.raw_text,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *`,
                [
                    userId,
                    doc.id,
                    analysis.fullName || "",
                    analysis.email || "",
                    analysis.phone || "",
                    analysis.location || "",
                    analysis.degree || "",
                    analysis.branch || "",
                    analysis.institution || "",
                    analysis.graduationYear || 2026,
                    analysis.cgpa || null,
                    JSON.stringify(analysis.skills || []),
                    JSON.stringify(analysis.experience || []),
                    JSON.stringify(analysis.projects || []),
                    JSON.stringify(analysis.certifications || []),
                    rawText
                ]
            );

            res.json({
                message: "Document intelligence extracted and profile updated successfully!",
                profile: upsertResult.rows[0],
                extractedVia: analysis.extractedVia
            });
        } catch (error) {
            console.error("EXTRACTION ERROR:", error);
            res.status(500).json({
                message: "Extraction failed: " + error.message
            });
        }
    }
);

// 7. Get Authenticated Student Profile (Real Data Only)
app.get(
    "/profile",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const result = await pool.query(
                `SELECT sp.*, d.original_name AS resume_filename
                 FROM student_profiles sp
                 LEFT JOIN documents d ON sp.resume_doc_id = d.id
                 WHERE sp.user_id = $1`,
                [userId]
            );

            res.json({
                profile: result.rows[0] || null
            });
        } catch (error) {
            console.error("FETCH PROFILE ERROR:", error);
            res.status(500).json({
                message: "Failed to fetch student profile"
            });
        }
    }
);

// 8. Update / Edit Student Profile
app.put(
    "/profile",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const {
                full_name,
                phone,
                location,
                degree,
                branch,
                institution,
                graduation_year,
                cgpa,
                skills,
                projects,
                experience,
                certifications,
                github_url,
                linkedin_url,
                portfolio_url,
                standing_arrears,
                preferred_roles
            } = req.body;

            const upsertResult = await pool.query(
                `INSERT INTO student_profiles (
                    user_id,
                    full_name,
                    phone,
                    location,
                    degree,
                    branch,
                    institution,
                    graduation_year,
                    cgpa,
                    skills,
                    experience,
                    projects,
                    certifications,
                    github_url,
                    linkedin_url,
                    portfolio_url,
                    standing_arrears,
                    preferred_roles,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    phone = EXCLUDED.phone,
                    location = EXCLUDED.location,
                    degree = EXCLUDED.degree,
                    branch = EXCLUDED.branch,
                    institution = EXCLUDED.institution,
                    graduation_year = EXCLUDED.graduation_year,
                    cgpa = EXCLUDED.cgpa,
                    skills = EXCLUDED.skills,
                    experience = EXCLUDED.experience,
                    projects = EXCLUDED.projects,
                    certifications = EXCLUDED.certifications,
                    github_url = EXCLUDED.github_url,
                    linkedin_url = EXCLUDED.linkedin_url,
                    portfolio_url = EXCLUDED.portfolio_url,
                    standing_arrears = EXCLUDED.standing_arrears,
                    preferred_roles = EXCLUDED.preferred_roles,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *`,
                [
                    userId,
                    full_name || "",
                    phone || "",
                    location || "",
                    degree || "",
                    branch || "",
                    institution || "",
                    graduation_year || 2026,
                    cgpa || null,
                    JSON.stringify(skills || []),
                    JSON.stringify(experience || []),
                    JSON.stringify(projects || []),
                    JSON.stringify(certifications || []),
                    github_url || "",
                    linkedin_url || "",
                    portfolio_url || "",
                    parseInt(standing_arrears, 10) || 0,
                    JSON.stringify(preferred_roles || [])
                ]
            );

            res.json({
                message: "Profile updated successfully",
                profile: upsertResult.rows[0]
            });
        } catch (error) {
            console.error("UPDATE PROFILE ERROR:", error);
            res.status(500).json({
                message: "Failed to update profile: " + error.message
            });
        }
    }
);

// 9. Document Q&A: Ask Questions Strictly About Uploaded Document (Option C Level 1)
app.post(
    "/documents/:id/ask",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            const { question } = req.body;
            if (!question || !question.trim()) {
                return res.status(400).json({
                    message: "Question is required"
                });
            }

            const docId = parseInt(req.params.id, 10);
            const docResult = await pool.query(
                `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
                [docId, userId]
            );

            if (docResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Document not found"
                });
            }

            const doc = docResult.rows[0];

            // Extract raw text
            const rawText = await extractor.extractText(
                doc.file_path,
                doc.file_type,
                doc.original_name || doc.filename
            );

            if (!rawText || !rawText.trim()) {
                return res.status(400).json({
                    message: "Unable to extract readable text from this document for Q&A."
                });
            }

            const answer = await extractor.askDocumentAI(
                rawText,
                question.trim(),
                doc.original_name || doc.filename
            );

            res.json({
                question: question.trim(),
                answer: answer,
                documentId: doc.id,
                documentName: doc.original_name || doc.filename
            });
        } catch (error) {
            console.error("DOCUMENT Q&A ERROR:", error);
            res.status(500).json({
                message: "Failed to answer question: " + error.message
            });
        }
    }
);


// ======================================================
// CAREER MATCHING ENGINE & OPPORTUNITY RADAR (VERSION 3)
// ======================================================

// 10. Fetch All Live Opportunities (with filters & search)
app.get(
    "/opportunities",
    async (req, res) => {
        try {
            const { 
                category, 
                domain,
                location, 
                work_mode, 
                organization_type,
                search, 
                sortBy 
            } = req.query;

            let query = `SELECT * FROM opportunities WHERE is_active = TRUE`;
            const params = [];

            if (category && category !== "all") {
                params.push(category);
                query += ` AND category = $${params.length}`;
            }

            if (domain && domain !== "all") {
                params.push(domain);
                query += ` AND domain = $${params.length}`;
            }

            if (location && location !== "all") {
                if (location.toLowerCase() === "remote") {
                    params.push("%remote%");
                    query += ` AND (LOWER(location) LIKE $${params.length} OR LOWER(work_mode) = 'remote')`;
                } else {
                    params.push(`%${location.toLowerCase()}%`);
                    query += ` AND LOWER(location) LIKE $${params.length}`;
                }
            }

            if (work_mode && work_mode !== "all") {
                params.push(work_mode);
                query += ` AND work_mode = $${params.length}`;
            }

            if (organization_type && organization_type !== "all") {
                params.push(organization_type);
                query += ` AND organization_type = $${params.length}`;
            }

            if (search && search.trim() !== "") {
                params.push(`%${search.trim().toLowerCase()}%`);
                query += ` AND (
                    LOWER(title) LIKE $${params.length} OR 
                    LOWER(organization) LIKE $${params.length} OR 
                    LOWER(description) LIKE $${params.length} OR
                    LOWER(location) LIKE $${params.length} OR
                    domain LIKE $${params.length} OR
                    eligible_degrees::text ILIKE $${params.length} OR
                    required_skills::text ILIKE $${params.length}
                )`;
            }

            if (sortBy === "deadline") {
                query += ` ORDER BY deadline ASC NULLS LAST`;
            } else {
                query += ` ORDER BY posted_at DESC`;
            }

            const result = await pool.query(query, params);
            let oppsList = result.rows;

            if ((search && search.trim().length > 1) || (location && location !== "all" && location !== "remote")) {
                if (oppsList.length < 6) {
                    try {
                        const liveNewJobs = await liveJobFetcher.fetchOnDemandLiveJobs(search || "", location !== "all" ? location : "");
                        for (const item of liveNewJobs) {
                            try {
                                const exist = await pool.query(
                                    `SELECT id FROM opportunities WHERE apply_url = $1 OR (title = $2 AND organization = $3)`,
                                    [item.apply_url, item.title, item.organization]
                                );
                                if (exist.rows.length === 0) {
                                    const inserted = await pool.query(
                                        `INSERT INTO opportunities (
                                            title, organization, category, organization_type, domain,
                                            location, work_mode, eligible_degrees, eligible_branches, eligible_years,
                                            min_cgpa, required_skills, salary_or_stipend, deadline, posted_at,
                                            apply_url, description, exam_stages, source
                                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                                        RETURNING *`,
                                        [
                                            item.title, item.organization, item.category, item.organization_type, item.domain,
                                            item.location, item.work_mode, JSON.stringify(item.eligible_degrees), JSON.stringify(item.eligible_branches), JSON.stringify(item.eligible_years),
                                            item.min_cgpa, JSON.stringify(item.required_skills), item.salary_or_stipend, item.deadline, item.posted_at,
                                            item.apply_url, item.description, JSON.stringify(item.exam_stages || []), item.source
                                        ]
                                    );
                                    if (inserted.rows.length > 0) {
                                        oppsList.push(inserted.rows[0]);
                                    }
                                }
                            } catch (e) {}
                        }
                    } catch (e) {}
                }
            }

            res.json({
                count: oppsList.length,
                opportunities: oppsList
            });
        } catch (error) {
            console.error("FETCH OPPORTUNITIES ERROR:", error);
            res.status(500).json({
                message: "Failed to fetch opportunities"
            });
        }
    }
);

// 11. Run Career Matching Engine for Authenticated Student
app.get(
    "/matches",
    async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({
                    message: "Not authenticated"
                });
            }

            // 1. Fetch student profile
            const profileResult = await pool.query(
                `SELECT * FROM student_profiles WHERE user_id = $1`,
                [userId]
            );
            const profile = profileResult.rows[0] || null;

            // 2. Fetch opportunities with optional filters
            const { category, domain, location, work_mode, organization_type, search } = req.query;
            let query = `SELECT * FROM opportunities WHERE is_active = TRUE`;
            const params = [];

            if (category && category !== "all") {
                params.push(category);
                query += ` AND category = $${params.length}`;
            }

            if (domain && domain !== "all") {
                params.push(domain);
                query += ` AND domain = $${params.length}`;
            }

            if (location && location !== "all") {
                if (location.toLowerCase() === "remote") {
                    params.push("%remote%");
                    query += ` AND (LOWER(location) LIKE $${params.length} OR LOWER(work_mode) = 'remote')`;
                } else {
                    params.push(`%${location.toLowerCase()}%`);
                    query += ` AND LOWER(location) LIKE $${params.length}`;
                }
            }

            if (work_mode && work_mode !== "all") {
                params.push(work_mode);
                query += ` AND work_mode = $${params.length}`;
            }

            if (organization_type && organization_type !== "all") {
                params.push(organization_type);
                query += ` AND organization_type = $${params.length}`;
            }

            if (search && search.trim() !== "") {
                params.push(`%${search.trim().toLowerCase()}%`);
                query += ` AND (
                    LOWER(title) LIKE $${params.length} OR 
                    LOWER(organization) LIKE $${params.length} OR 
                    LOWER(location) LIKE $${params.length} OR
                    domain LIKE $${params.length} OR
                    eligible_degrees::text ILIKE $${params.length} OR
                    required_skills::text ILIKE $${params.length}
                )`;
            }

            const oppsResult = await pool.query(query, params);
            let opportunities = oppsResult.rows;

            // SMART ON-DEMAND LIVE INTEGRATION (Multi-Engine)
            // If the student searched for a specific company or interior location,
            // and the database has fewer than 6 results:
            // trigger liveJobFetcher.fetchOnDemandLiveJobs(search, location) on the fly!
            if ((search && search.trim().length > 1) || (location && location !== "all" && location !== "remote")) {
                if (opportunities.length < 6) {
                    console.log(`⚡ [On-Demand Trigger] Under 6 results for search="${search || ''}" loc="${location || ''}". Querying live streams...`);
                    try {
                        const liveNewJobs = await liveJobFetcher.fetchOnDemandLiveJobs(search || "", location !== "all" ? location : "");
                        for (const item of liveNewJobs) {
                            try {
                                const exist = await pool.query(
                                    `SELECT id FROM opportunities WHERE apply_url = $1 OR (title = $2 AND organization = $3)`,
                                    [item.apply_url, item.title, item.organization]
                                );
                                if (exist.rows.length === 0) {
                                    const inserted = await pool.query(
                                        `INSERT INTO opportunities (
                                            title, organization, category, organization_type, domain,
                                            location, work_mode, eligible_degrees, eligible_branches, eligible_years,
                                            min_cgpa, required_skills, salary_or_stipend, deadline, posted_at,
                                            apply_url, description, exam_stages, source
                                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                                        RETURNING *`,
                                        [
                                            item.title, item.organization, item.category, item.organization_type, item.domain,
                                            item.location, item.work_mode, JSON.stringify(item.eligible_degrees), JSON.stringify(item.eligible_branches), JSON.stringify(item.eligible_years),
                                            item.min_cgpa, JSON.stringify(item.required_skills), item.salary_or_stipend, item.deadline, item.posted_at,
                                            item.apply_url, item.description, JSON.stringify(item.exam_stages || []), item.source
                                        ]
                                    );
                                    if (inserted.rows.length > 0) {
                                        opportunities.push(inserted.rows[0]);
                                    }
                                }
                            } catch (insertErr) {
                                // Ignore duplicate
                            }
                        }
                    } catch (liveErr) {
                        console.warn("Live on-demand query notice:", liveErr.message);
                    }
                }
            }

            // 3. Rank opportunities using matchingEngine
            const ranked = matchingEngine.rankOpportunities(profile, opportunities);

            res.json({
                hasProfile: !!profile,
                studentInfo: profile ? {
                    fullName: profile.full_name,
                    degree: profile.degree,
                    branch: profile.branch,
                    graduationYear: profile.graduation_year,
                    cgpa: profile.cgpa,
                    skillsCount: Array.isArray(profile.skills) ? profile.skills.length : 0
                } : null,
                totalMatches: ranked.length,
                matches: ranked
            });
        } catch (error) {
            console.error("CAREER MATCHING ENGINE ERROR:", error);
            res.status(500).json({
                message: "Failed to calculate career matches: " + error.message
            });
        }
    }
);

// 12. Get Match & Opportunity Summary Stats (for Dashboard)
app.get(
    "/matches/stats",
    async (req, res) => {
        try {
            const userId = req.session.user?.id || null;

            // Overall opportunities count
            const totalsResult = await pool.query(`
                SELECT 
                    COUNT(*)::int AS total_opportunities,
                    COUNT(*) FILTER (WHERE category = 'job')::int AS total_jobs,
                    COUNT(*) FILTER (WHERE category = 'internship')::int AS total_internships,
                    COUNT(*) FILTER (WHERE category = 'government_exam')::int AS total_exams,
                    COUNT(*) FILTER (WHERE category = 'government_exam' AND deadline <= NOW() + INTERVAL '7 days')::int AS urgent_exams
                FROM opportunities 
                WHERE is_active = TRUE
            `);

            // Fetch student profile
            const profileResult = await pool.query(
                `SELECT * FROM student_profiles WHERE user_id = $1`,
                [userId]
            );
            const profile = profileResult.rows[0] || null;

            let highMatchCount = 0;
            let eligibleCount = 0;
            let topRecommendations = [];

            if (profile) {
                const oppsResult = await pool.query(`SELECT * FROM opportunities WHERE is_active = TRUE`);
                const ranked = matchingEngine.rankOpportunities(profile, oppsResult.rows);

                highMatchCount = ranked.filter(r => r.match.priorityLevel === "high").length;
                eligibleCount = ranked.filter(r => r.match.isEligible).length;
                topRecommendations = ranked.slice(0, 3);
            }

            res.json({
                hasProfile: !!profile,
                stats: {
                    ...totalsResult.rows[0],
                    highMatchCount,
                    eligibleCount
                },
                topRecommendations
            });
        } catch (error) {
            console.error("MATCH STATS ERROR:", error);
            res.status(500).json({
                message: "Failed to fetch match statistics"
            });
        }
    }
);

// 13. Dynamic Open Ingestion Endpoint (Accepts ANY job/exam from any source)
app.post(
    "/opportunities/ingest",
    async (req, res) => {
        try {
            const {
                title,
                organization,
                category = "job",
                organization_type = "mid_size",
                domain = "software_web",
                location = "India",
                work_mode = "On-site",
                eligible_degrees = ["Any Graduate"],
                eligible_branches = ["All"],
                eligible_years = [2025, 2026],
                min_cgpa = 0,
                required_skills = [],
                salary_or_stipend = "Best in Industry",
                deadline,
                apply_url,
                description = "",
                exam_stages = [],
                raw_text
            } = req.body;

            // If raw text is provided without structured fields, parse via AI!
            let finalTitle = title;
            let finalOrg = organization;
            let finalSkills = required_skills;
            let finalApplyUrl = apply_url;
            let finalDesc = description;

            if (raw_text && (!finalTitle || !finalOrg)) {
                try {
                    const prompt = `Extract job opportunity details from this text and return ONLY JSON:
{
  "title": "Role title",
  "organization": "Company or Board name",
  "category": "job" or "internship" or "government_exam",
  "location": "City or All India",
  "required_skills": ["Skill1", "Skill2"],
  "salary_or_stipend": "Salary text or null",
  "apply_url": "URL or null",
  "description": "Short 2 sentence summary"
}

RAW TEXT:
${raw_text.substring(0, 3000)}`;

                    const aiResponse = await extractor.callGeminiModel(prompt);
                    const cleanJson = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleanJson);
                    finalTitle = parsed.title || finalTitle || "Career Opportunity";
                    finalOrg = parsed.organization || finalOrg || "Direct Hiring";
                    finalSkills = parsed.required_skills || finalSkills;
                    finalApplyUrl = parsed.apply_url || finalApplyUrl || "https://docmind.ai";
                    finalDesc = parsed.description || finalDesc;
                } catch (aiErr) {
                    console.log("Raw text AI extraction fallback:", aiErr.message);
                }
            }

            if (!finalTitle || !finalOrg) {
                return res.status(400).json({
                    message: "Title and Organization are required"
                });
            }

            const insertResult = await pool.query(
                `INSERT INTO opportunities (
                    title, organization, category, organization_type, domain,
                    location, work_mode, eligible_degrees, eligible_branches, eligible_years,
                    min_cgpa, required_skills, salary_or_stipend, deadline, posted_at,
                    apply_url, description, exam_stages, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, $15, $16, $17, $18)
                RETURNING *`,
                [
                    finalTitle,
                    finalOrg,
                    category,
                    organization_type,
                    domain,
                    location,
                    work_mode,
                    JSON.stringify(eligible_degrees),
                    JSON.stringify(eligible_branches),
                    JSON.stringify(eligible_years),
                    min_cgpa || 0,
                    JSON.stringify(finalSkills),
                    salary_or_stipend,
                    deadline ? new Date(deadline) : null,
                    finalApplyUrl || "https://docmind.ai",
                    finalDesc,
                    JSON.stringify(exam_stages || []),
                    "Dynamic Ingest API"
                ]
            );

            res.status(201).json({
                message: "Opportunity ingested live with timestamp!",
                opportunity: insertResult.rows[0]
            });
        } catch (error) {
            console.error("OPPORTUNITY INGEST ERROR:", error);
            res.status(500).json({
                message: "Failed to ingest opportunity: " + error.message
            });
        }
    }
);

// 14. Instant WhatsApp Share & Alert Trigger
app.post(
    "/opportunities/:id/whatsapp-alert",
    async (req, res) => {
        try {
            const oppId = parseInt(req.params.id, 10);
            const { phone } = req.body;

            const oppResult = await pool.query(
                `SELECT * FROM opportunities WHERE id = $1`,
                [oppId]
            );

            if (oppResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Opportunity not found"
                });
            }

            const opp = oppResult.rows[0];

            // Format clean WhatsApp message text
            const deadlineText = opp.deadline 
                ? new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "Open until filled";

            const message = 
`🚀 *DocMind AI Career Alert*
💼 *${opp.title}*
🏢 *${opp.organization}*
📍 *Location:* ${opp.location} (${opp.work_mode})
💰 *Pay:* ${opp.salary_or_stipend || "Competitive"}
⏳ *Deadline:* ${deadlineText}

🔗 *Apply Directly:* ${opp.apply_url}

_Sent via DocMind AI Career Intelligence_`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = phone 
                ? `https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, "")}&text=${encodedMessage}`
                : `https://api.whatsapp.com/send?text=${encodedMessage}`;

            res.json({
                message: "WhatsApp alert generated successfully",
                whatsappUrl,
                alertPayload: {
                    opportunityTitle: opp.title,
                    organization: opp.organization,
                    rawMessage: message
                }
            });
        } catch (error) {
            console.error("WHATSAPP ALERT ERROR:", error);
            res.status(500).json({
                message: "Failed to create WhatsApp alert: " + error.message
            });
        }
    }
);

// 15. Live Internet Ingestion Trigger (Corporate Jobs & Govt Exam Feeds)
app.post(
    "/opportunities/sync-live",
    async (req, res) => {
        try {
            console.log("Client triggered manual live internet sync...");
            const { search, location } = req.body || {};
            let onDemandCount = 0;

            if (search || (location && location !== "all")) {
                console.log(`Live on-demand query triggered for search="${search || ''}", loc="${location || ''}"`);
                try {
                    const onDemandJobs = await liveJobFetcher.fetchOnDemandLiveJobs(search || "", location !== "all" ? location : "");
                    for (const item of onDemandJobs) {
                        try {
                            const existing = await pool.query(
                                `SELECT id FROM opportunities WHERE apply_url = $1 OR (title = $2 AND organization = $3)`,
                                [item.apply_url, item.title, item.organization]
                            );
                            if (existing.rows.length === 0) {
                                await pool.query(
                                    `INSERT INTO opportunities (
                                        title, organization, category, organization_type, domain,
                                        location, work_mode, eligible_degrees, eligible_branches, eligible_years,
                                        min_cgpa, required_skills, salary_or_stipend, deadline, posted_at,
                                        apply_url, description, exam_stages, source
                                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17, $18)`,
                                    [
                                        item.title, item.organization, item.category, item.organization_type, item.domain,
                                        item.location, item.work_mode, JSON.stringify(item.eligible_degrees), JSON.stringify(item.eligible_branches), JSON.stringify(item.eligible_years),
                                        item.min_cgpa, JSON.stringify(item.required_skills), item.salary_or_stipend, item.deadline,
                                        item.apply_url, item.description, JSON.stringify(item.exam_stages || []), item.source
                                    ]
                                );
                                onDemandCount++;
                            } else {
                                await pool.query(
                                    `UPDATE opportunities SET posted_at = NOW(), is_active = TRUE WHERE id = $1`,
                                    [existing.rows[0].id]
                                );
                                onDemandCount++;
                            }
                        } catch (err) {}
                    }
                } catch (onDemandErr) {
                    console.warn("On-demand sync notice:", onDemandErr.message);
                }
            }

            const syncResult = await liveJobFetcher.syncLiveOpportunitiesFromWeb(pool);
            const totalUpdated = (syncResult.newlyInserted || 0) + (syncResult.refreshedCount || 0) + onDemandCount;

            res.json({
                success: true,
                message: `Live web sync complete! Scanned live internet feeds, refreshed ${totalUpdated} opportunities with latest timestamps at the top.`,
                totalFetched: (syncResult.totalFetched || 0) + onDemandCount,
                newlyInserted: syncResult.newlyInserted || 0,
                refreshedCount: (syncResult.refreshedCount || 0) + onDemandCount
            });
        } catch (error) {
            console.error("LIVE SYNC ERROR:", error);
            res.status(500).json({
                message: "Failed to sync opportunities from web: " + error.message
            });
        }
    }
);



// ======================================================
// SEND OTP
// ======================================================

app.post(
    "/auth/send-otp",

    async (req, res) => {

        try {

            let {
                email,
                purpose
            } = req.body;


            // Validate purpose

            if (
                purpose !== "register" &&
                purpose !== "reset"
            ) {

                return res.status(400).json({

                    message:
                        "Invalid OTP purpose"

                });

            }


            // Validate email

            if (!email) {

                return res.status(400).json({

                    message:
                        "Email is required"

                });

            }


            email =
                normalizeEmail(email);


            // Check whether user exists

            const userResult =
                await pool.query(

                    "SELECT id FROM users WHERE email = $1",

                    [email]

                );


            const userExists =
                userResult.rows.length > 0;


            // Registration:
            // user must NOT already exist

            if (
                purpose === "register" &&
                userExists
            ) {

                return res.status(409).json({

                    message:
                        "An account already exists with this email"

                });

            }


            // Password reset:
            // user must exist

            if (
                purpose === "reset" &&
                !userExists
            ) {

                return res.status(404).json({

                    message:
                        "No account found with this email"

                });

            }


            // OTP key

            const key =
                getOtpKey(
                    purpose,
                    email
                );


            // Resend cooldown

            const existingOTP =
                otpStore.get(key);


            if (
                existingOTP &&
                Date.now() <
                existingOTP.resendAvailableAt
            ) {

                const remaining =
                    Math.ceil(

                        (
                            existingOTP.resendAvailableAt -
                            Date.now()
                        ) / 1000

                    );


                return res.status(429).json({

                    message:
                        `Please wait ${remaining} seconds before requesting another OTP`,

                    retryAfter:
                        remaining

                });

            }


            // Generate OTP

            const otp =
                generateOTP();


            // Store hashed OTP

            otpStore.set(

                key,

                {

                    otpHash:
                        hashOTP(otp),

                    expiresAt:
                        Date.now() +
                        OTP_EXPIRY_MS,

                    resendAvailableAt:
                        Date.now() +
                        RESEND_COOLDOWN_MS,

                    attempts: 0

                }

            );


            // Send email

            await sendOTPEmail(
                email,
                otp,
                purpose
            );


            console.log(
                `OTP sent for ${purpose}: ${email}`
            );


            res.json({

                message:
                    "OTP sent successfully",

                cooldown:
                    RESEND_COOLDOWN_MS / 1000

            });

        }

        catch (error) {

            console.error(
                "SEND OTP ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to send OTP"

            });

        }

    }
);


// ======================================================
// VERIFY OTP
// ======================================================

app.post(
    "/auth/verify-otp",

    (req, res) => {

        let {
            email,
            otp,
            purpose
        } = req.body;


        // Validate

        if (
            !email ||
            !otp ||
            !purpose
        ) {

            return res.status(400).json({

                message:
                    "Email, OTP and purpose are required"

            });

        }


        if (
            purpose !== "register" &&
            purpose !== "reset"
        ) {

            return res.status(400).json({

                message:
                    "Invalid OTP purpose"

            });

        }


        email =
            normalizeEmail(email);


        const key =
            getOtpKey(
                purpose,
                email
            );


        const stored =
            otpStore.get(key);


        // OTP not found

        if (!stored) {

            return res.status(400).json({

                message:
                    "OTP not found. Please request a new OTP."

            });

        }


        // OTP expired

        if (
            Date.now() >
            stored.expiresAt
        ) {

            otpStore.delete(key);

            return res.status(410).json({

                message:
                    "OTP expired. Please request a new OTP."

            });

        }


        // Maximum attempts

        if (
            stored.attempts >=
            MAX_OTP_ATTEMPTS
        ) {

            otpStore.delete(key);

            return res.status(429).json({

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });

        }


        // Compare hash

        const submittedHash =
            hashOTP(
                String(otp)
            );


        if (
            submittedHash !==
            stored.otpHash
        ) {

            stored.attempts++;


            return res.status(400).json({

                message:
                    `Invalid OTP. ${MAX_OTP_ATTEMPTS - stored.attempts} attempts remaining.`

            });

        }


        // Successful verification

        otpStore.delete(key);


        verifiedActions.set(

            key,

            {

                expiresAt:
                    Date.now() +
                    VERIFIED_WINDOW_MS

            }

        );


        res.json({

            message:
                "OTP verified successfully"

        });

    }

);


// ======================================================
// REGISTER
// ======================================================

app.post(
    "/auth/register",

    async (req, res) => {

        try {

            let {
                email,
                password
            } = req.body;


            if (!email || !password) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            email =
                normalizeEmail(email);


            // Password validation

            if (password.length < 8) {

                return res.status(400).json({

                    message:
                        "Password must contain at least 8 characters"

                });

            }


            // Check OTP verification

            const key =
                getOtpKey(
                    "register",
                    email
                );


            const verification =
                verifiedActions.get(key);


            if (!verification) {

                return res.status(403).json({

                    message:
                        "Please verify your email first"

                });

            }


            if (
                Date.now() >
                verification.expiresAt
            ) {

                verifiedActions.delete(key);

                return res.status(403).json({

                    message:
                        "Email verification expired. Please verify again."

                });

            }


            // Check existing user

            const existingUser =
                await pool.query(

                    "SELECT id FROM users WHERE email = $1",

                    [email]

                );


            if (
                existingUser.rows.length > 0
            ) {

                verifiedActions.delete(key);

                return res.status(409).json({

                    message:
                        "User already exists"

                });

            }


            // Hash password

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            // Create user

            const result =
                await pool.query(

                    `INSERT INTO users
                    (
                        email,
                        password_hash
                    )
                    VALUES ($1, $2)
                    RETURNING id, email, created_at`,

                    [
                        email,
                        passwordHash
                    ]

                );


            // Consume verification

            verifiedActions.delete(key);


            res.status(201).json({

                message:
                    "Account created successfully",

                user:
                    result.rows[0]

            });

        }

        catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Something went wrong"

            });

        }

    }
);


// ======================================================
// RESET PASSWORD
// ======================================================

app.post(
    "/auth/reset-password",

    async (req, res) => {

        try {

            let {
                email,
                password
            } = req.body;


            if (!email || !password) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            email =
                normalizeEmail(email);


            if (password.length < 8) {

                return res.status(400).json({

                    message:
                        "Password must contain at least 8 characters"

                });

            }


            // Check reset OTP verification

            const key =
                getOtpKey(
                    "reset",
                    email
                );


            const verification =
                verifiedActions.get(key);


            if (!verification) {

                return res.status(403).json({

                    message:
                        "Please verify the reset OTP first"

                });

            }


            if (
                Date.now() >
                verification.expiresAt
            ) {

                verifiedActions.delete(key);

                return res.status(403).json({

                    message:
                        "Password reset verification expired"

                });

            }


            // Hash new password

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            // Update password

            const result =
                await pool.query(

                    `UPDATE users
                     SET password_hash = $1
                     WHERE email = $2
                     RETURNING id, email`,

                    [
                        passwordHash,
                        email
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                verifiedActions.delete(key);

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            // Consume reset verification

            verifiedActions.delete(key);


            res.json({

                message:
                    "Password reset successfully"

            });

        }

        catch (error) {

            console.error(
                "RESET PASSWORD ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Something went wrong"

            });

        }

    }
);


// ======================================================
// LOGIN
// ======================================================

app.post(
    "/auth/login",

    async (req, res) => {

        try {

            let {
                email,
                password
            } = req.body;


            if (!email || !password) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            email =
                normalizeEmail(email);


            // Find user

            const result =
                await pool.query(

                    `SELECT
                        id,
                        email,
                        password_hash
                     FROM users
                     WHERE email = $1`,

                    [email]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            const user =
                result.rows[0];


            // Check password

            const passwordMatch =
                await bcrypt.compare(

                    password,

                    user.password_hash

                );


            if (!passwordMatch) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            // Create new session

            req.session.regenerate(

                (error) => {

                    if (error) {

                        console.error(
                            "SESSION ERROR:",
                            error
                        );

                        return res.status(500).json({

                            message:
                                "Could not create login session"

                        });

                    }


                    req.session.user = {

                        id:
                            user.id,

                        email:
                            user.email

                    };


                    req.session.save(

                        (saveError) => {

                            if (saveError) {

                                console.error(
                                    "SESSION SAVE ERROR:",
                                    saveError
                                );

                                return res.status(500).json({

                                    message:
                                        "Could not save login session"

                                });

                            }


                            // Enrich with profile full_name if available
                            pool.query(
                                "SELECT full_name FROM student_profiles WHERE user_id = $1",
                                [user.id]
                            ).then((profResult) => {
                                const fullName = profResult.rows[0]?.full_name || null;
                                res.json({
                                    message: "Login successful",
                                    user: {
                                        ...req.session.user,
                                        fullName: fullName
                                    }
                                });
                            }).catch(() => {
                                res.json({
                                    message: "Login successful",
                                    user: req.session.user
                                });
                            });
                        }
                    );
                }
            );
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            res.status(500).json({
                message: "Something went wrong"
            });
        }
    }
);

// ======================================================
// CHECK CURRENT LOGIN
// ======================================================

app.get(
    "/auth/me",
    async (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({
                message: "Not authenticated"
            });
        }

        try {
            const profResult = await pool.query(
                "SELECT full_name FROM student_profiles WHERE user_id = $1",
                [req.session.user.id]
            );
            const fullName = profResult.rows[0]?.full_name || null;

            res.json({
                authenticated: true,
                user: {
                    ...req.session.user,
                    fullName: fullName
                }
            });
        } catch (err) {
            res.json({
                authenticated: true,
                user: req.session.user
            });
        }
    }
);


// ======================================================
// LOGOUT
// ======================================================

app.post(
    "/auth/logout",

    (req, res) => {

        req.session.destroy(

            (error) => {

                if (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Could not logout"

                    });

                }


                res.clearCookie(
                    "docmind.sid"
                );


                res.json({

                    message:
                        "Logged out successfully"

                });

            }

        );

    }

);


// ======================================================
// BASIC TEST ROUTE
// ======================================================

app.get(
    "/",

    (req, res) => {

        res.send(
            "DocMind Backend is running"
        );

    }
);

// ======================================================
// CAREER AI MENTOR ENDPOINTS
// Company PYQ Extractor, Mock Tests, AI Interviewer, Resume Roast
// ======================================================

// 1. Company PYQ Extractor (Previously Asked Questions)
app.get("/api/mentor/pyq", async (req, res) => {
    try {
        const company = req.query.company || "zoho";
        const role = req.query.role || "Software Engineer";
        const result = await mentorService.getCompanyPYQs(company, role);
        res.json(result);
    } catch (err) {
        console.error("Error in /api/mentor/pyq:", err);
        res.status(500).json({ error: "Failed to extract company questions" });
    }
});

// 2. Company Mock Test Generator
app.get("/api/mentor/mock-test", async (req, res) => {
    try {
        const company = req.query.company || "zoho";
        const role = req.query.role || "Software Engineer";
        const result = await mentorService.generateCompanyMockTest(company, role);
        res.json(result);
    } catch (err) {
        console.error("Error in /api/mentor/mock-test:", err);
        res.status(500).json({ error: "Failed to generate company mock test" });
    }
});

// 3. Interactive AI Mock Interview Evaluator
app.post("/api/mentor/interview-evaluate", async (req, res) => {
    try {
        const { company, role, question, answer, history } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ error: "Question and Answer are required." });
        }
        const result = await mentorService.evaluateInterviewAnswer({
            company: company || "General Tech",
            role: role || "Software Engineer",
            question,
            answer,
            history
        });
        res.json(result);
    } catch (err) {
        console.error("Error in /api/mentor/interview-evaluate:", err);
        res.status(500).json({ error: "Failed to evaluate interview answer" });
    }
});

// 3.1 Generate Dynamic Initial Interview Question
app.get("/api/mentor/interview-init", async (req, res) => {
    try {
        const company = req.query.company || "Zoho";
        const role = req.query.role || "Software Engineer";
        const result = await mentorService.generateInitialInterviewQuestion({ company, role });
        res.json(result);
    } catch (err) {
        console.error("Error in /api/mentor/interview-init:", err);
        res.status(500).json({ error: "Failed to generate initial interview question" });
    }
});

// 3.1b Personal AI Voice Communication Coach Topics & Practice Prompts
app.get("/api/mentor/voice-coach/topics", (req, res) => {
    try {
        const topics = mentorService.getVoiceCoachPrompts();
        res.json({ topics });
    } catch (err) {
        console.error("Error fetching voice coach topics:", err);
        res.status(500).json({ error: "Failed to fetch voice coach topics" });
    }
});

// 3.1c Personal AI Voice Communication Coach Spoken Speech Evaluation
app.post("/api/mentor/voice-coach/evaluate", async (req, res) => {
    try {
        const { topic, prompt, transcript, durationSeconds, history } = req.body;
        const evaluation = await mentorService.evaluateVoiceCommunication({
            topic: topic || "elevator_pitch",
            prompt: prompt || "Tell me about yourself",
            transcript: transcript || "",
            durationSeconds: durationSeconds || 30,
            history: history || []
        });
        res.json(evaluation);
    } catch (err) {
        console.error("Error evaluating voice communication:", err);
        res.status(500).json({ error: "Failed to evaluate spoken communication" });
    }
});


// 3.2 Real-Time Code Solution Evaluator (LeetCode Runner & Submitter)
app.post("/api/mentor/evaluate-code", async (req, res) => {
    try {
        const { company, role, problemId, code, language, mode, testCases } = req.body;
        if (!code) {
            return res.status(400).json({ error: "Code is required for evaluation." });
        }
        const result = await mentorService.evaluateCodeSolution({
            company: company || "General Tech",
            role: role || "Software Engineer",
            problemId: problemId || "code-1",
            code,
            language: language || "javascript",
            mode: mode || "run",
            testCases: testCases || []
        });
        res.json(result);
    } catch (err) {
        console.error("Error in /api/mentor/evaluate-code:", err);
        res.status(500).json({ error: "Failed to evaluate code" });
    }
});

// 3.3 Interactive AI Career Copilot Chatbot (Resume Grounded & Live Opportunities)
app.post("/api/mentor/chat", async (req, res) => {
    try {
        let userId = req.session && req.session.user ? req.session.user.id : (req.session && req.session.userId ? req.session.userId : null);
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message content cannot be empty." });
        }

        const chatResponse = await careerChatService.handleCareerChatMessage({
            message: message.trim(),
            history: Array.isArray(history) ? history : [],
            userId,
            pool
        });

        res.json(chatResponse);
    } catch (err) {
        console.error("Error in /api/mentor/chat:", err);
        res.status(500).json({ 
            error: "Career Copilot processing error: " + err.message,
            reply: "I encountered a brief connection issue reviewing your career query. Please try again in a moment."
        });
    }
});

app.get("/api/mentor/chat/init", async (req, res) => {
    try {
        let userId = req.session && req.session.user ? req.session.user.id : (req.session && req.session.userId ? req.session.userId : null);
        const candidate = await careerChatService.getCandidateContext(userId, pool);
        const eligibleList = await careerChatService.getEligibleOpportunitiesForCandidate(candidate, pool, 4);

        const firstName = candidate.fullName.split(" ")[0] || "there";
        const topCompany = eligibleList[0] ? eligibleList[0].organization : "Zoho";

        res.json({
            candidate,
            eligiblePreviewCount: eligibleList.length,
            welcomeMessage: `### 👋 Hi ${firstName}! I'm your DocMind Career Copilot.\n\n` +
                           `I've loaded your **${candidate.degree} (${candidate.branch})** profile from your Vault with **${candidate.cgpa} CGPA** (Batch **${candidate.graduationYear}**).\n\n` +
                           `I have direct access to your verified skills: **${candidate.skills.slice(0, 5).join(", ")}**.\n\n` +
                           `How can I help you today? You can ask me to **check your eligible companies**, **break down any company's interview rounds & questions**, or **launch an instant timed mock test**!`,
            starterPrompts: [
                "🎯 Check which companies I'm eligible for right now",
                `🏢 Tell me about ${topCompany}'s hiring process and questions`,
                `📝 Launch a mock test for ${topCompany}`,
                "🏛️ Which Government exams can I apply for with my degree?",
                "💼 What are the highest paying roles matching my resume?"
            ]
        });
    } catch (err) {
        console.error("Error in /api/mentor/chat/init:", err);
        res.status(500).json({ error: "Failed to initialize career chat session" });
    }
});

// 4. Student Resume Roast & ATS Booster (Database Grounded)
app.get("/api/mentor/resume-roast", async (req, res) => {
    try {
        const userId = req.session && req.session.userId ? req.session.userId : null;
        let profile = null;
        if (userId) {
            const profileRes = await pool.query("SELECT * FROM student_profiles WHERE user_id = $1", [userId]);
            if (profileRes.rows.length > 0) {
                profile = profileRes.rows[0];
            }
        }
        if (!profile) {
            // Fallback to the latest saved profile in system
            const fallbackRes = await pool.query("SELECT * FROM student_profiles ORDER BY updated_at DESC LIMIT 1");
            if (fallbackRes.rows.length > 0) {
                profile = fallbackRes.rows[0];
            }
        }

        if (!profile) {
            return res.status(404).json({ error: "No student profile found in database. Please upload your resume in the Vault." });
        }

        const roastResult = await mentorService.roastAndBoostResume(profile);
        res.json({
            profile: {
                fullName: profile.full_name,
                degree: profile.degree,
                branch: profile.branch,
                institution: profile.institution,
                cgpa: profile.cgpa,
                skillsCount: (profile.skills || []).length
            },
            ...roastResult
        });
    } catch (err) {
        console.error("Error in /api/mentor/resume-roast:", err);
        res.status(500).json({ error: "Failed to run resume roast" });
    }
});

// 5. Govt Exam Preparation Guide
app.get("/api/mentor/govt-guide", (req, res) => {
    try {
        const exam = req.query.exam || "upsc";
        const guide = mentorService.getGovtExamGuide(exam);
        res.json(guide);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch exam guide" });
    }
});

// ======================================================
// 6. GOVERNMENT EXAMS INTELLIGENCE & ARENA ENDPOINTS
// ======================================================

// 6.1 Get All Exam Patterns & Syllabi
app.get("/api/govt-exams/patterns", (req, res) => {
    try {
        res.json({ patterns: Object.values(govtExamService.GOVT_EXAM_PATTERNS) });
    } catch (err) {
        console.error("Error fetching govt exam patterns:", err);
        res.status(500).json({ error: "Failed to fetch government exam patterns" });
    }
});

// 6.2 Get Single Exam Pattern / Syllabus Details
app.get("/api/govt-exams/pattern/:id", (req, res) => {
    try {
        const pattern = govtExamService.GOVT_EXAM_PATTERNS[req.params.id];
        if (!pattern) {
            return res.status(404).json({ error: "Exam pattern not found" });
        }
        res.json({ pattern });
    } catch (err) {
        console.error("Error fetching govt exam pattern:", err);
        res.status(500).json({ error: "Failed to fetch government exam pattern" });
    }
});

// 6.3 Automated Eligibility & Age Radar
app.post("/api/govt-exams/eligibility-radar", (req, res) => {
    try {
        const result = govtExamService.calculateGovtEligibility(req.body);
        res.json(result);
    } catch (err) {
        console.error("Error calculating eligibility:", err);
        res.status(500).json({ error: "Failed to calculate government exam eligibility" });
    }
});

// 6.4 Generate Authentic Government Exam Mock Test (Static Compatibility)
app.get("/api/govt-exams/mock-test", (req, res) => {
    try {
        const exam = req.query.exam || "ssc_cgl";
        const testData = govtExamService.generateGovtExamMockTest(exam);
        res.json(testData);
    } catch (err) {
        console.error("Error generating govt mock test:", err);
        res.status(500).json({ error: "Failed to generate government mock test" });
    }
});

// 6.5 Dynamic On-Demand Researched Mock Test & PYQ Paper for ANY Exam
app.post("/api/govt-exams/dynamic-mock-test", async (req, res) => {
    try {
        let payload = { ...req.body };
        if (payload.examId) {
            try {
                const oppRes = await pool.query("SELECT * FROM opportunities WHERE id = $1", [payload.examId]);
                if (oppRes.rows.length > 0) {
                    const row = oppRes.rows[0];
                    payload.title = payload.title || row.title;
                    payload.organization = payload.organization || row.organization;
                    payload.description = payload.description || row.description;
                    payload.domain = payload.domain || row.domain;
                    payload.location = payload.location || row.location;
                    payload.eligible_degrees = payload.eligible_degrees || row.eligible_degrees;
                    payload.exam_stages = payload.exam_stages || row.exam_stages;
                    payload.organization_type = payload.organization_type || row.organization_type;
                }
            } catch (dbErr) {
                console.warn("Notice: Could not load opportunity details from DB for mock test:", dbErr.message);
            }
        }
        const testData = await govtExamService.generateDynamicGovtExamMockTest(payload);
        res.json(testData);
    } catch (err) {
        console.error("Error generating dynamic govt mock test:", err);
        res.status(500).json({ error: "Failed to research and generate government exam test paper" });
    }
});

app.get("/api/govt-exams/dynamic-mock-test", async (req, res) => {
    try {
        const testData = await govtExamService.generateDynamicGovtExamMockTest({
            title: req.query.title,
            organization: req.query.organization,
            domain: req.query.domain,
            examKey: req.query.examKey,
            mode: req.query.mode
        });
        res.json(testData);
    } catch (err) {
        console.error("Error generating dynamic govt mock test (GET):", err);
        res.status(500).json({ error: "Failed to research and generate government exam test paper" });
    }
});

// 6.6 Multi-Document to Government Exam Matcher & DV Readiness Audit
app.get("/api/govt-exams/document-matches", async (req, res) => {
    try {
        let userId = req.session.user?.id;
        if (!userId) {
            // Graceful fallback to student demo user or first user for frictionless access
            const fallbackUser = await pool.query(
                `SELECT id FROM users WHERE email = 'student.demo@docmind.ai' UNION SELECT id FROM users ORDER BY id ASC LIMIT 1`
            );
            if (fallbackUser.rows.length > 0) {
                userId = fallbackUser.rows[0].id;
            }
        }

        if (!userId) {
            return res.status(401).json({ error: "User profile or session not found" });
        }

        const matchResults = await govDocumentMatcher.matchGovtExamsWithDocuments(userId, pool);
        res.json(matchResults);
    } catch (err) {
        console.error("Error matching government exams with document vault:", err);
        res.status(500).json({ error: "Failed to audit government exams against document vault: " + err.message });
    }
});

// 6.7 Update Candidate DV Profile (DOB, Category, Domicile, Skills)
app.post("/api/govt-exams/update-dv-profile", async (req, res) => {
    try {
        let userId = req.session.user?.id;
        if (!userId) {
            const fallbackUser = await pool.query(
                `SELECT id FROM users WHERE email = 'student.demo@docmind.ai' UNION SELECT id FROM users ORDER BY id ASC LIMIT 1`
            );
            if (fallbackUser.rows.length > 0) {
                userId = fallbackUser.rows[0].id;
            }
        }

        if (!userId) {
            return res.status(401).json({ error: "User session not found" });
        }

        const { dob, category, domicileState, specialQualifications } = req.body;

        // Ensure student profile exists
        const checkProfile = await pool.query(`SELECT id FROM student_profiles WHERE user_id = $1`, [userId]);
        if (checkProfile.rows.length === 0) {
            await pool.query(
                `INSERT INTO student_profiles (user_id, dob, category, domicile_state, special_qualifications)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, dob || null, category || 'General', domicileState || 'All India', JSON.stringify(specialQualifications || {})]
            );
        } else {
            await pool.query(
                `UPDATE student_profiles
                 SET dob = COALESCE($1, dob),
                     category = COALESCE($2, category),
                     domicile_state = COALESCE($3, domicile_state),
                     special_qualifications = COALESCE($4, special_qualifications),
                     updated_at = NOW()
                 WHERE user_id = $5`,
                [dob || null, category || null, domicileState || null, specialQualifications ? JSON.stringify(specialQualifications) : null, userId]
            );
        }

        const updatedMatches = await govDocumentMatcher.matchGovtExamsWithDocuments(userId, pool);
        res.json({
            message: "Candidate DV credentials updated successfully",
            ...updatedMatches
        });
    } catch (err) {
        console.error("Error updating candidate DV profile:", err);
        res.status(500).json({ error: "Failed to update candidate DV profile: " + err.message });
    }
});

// ======================================================
// CAREER ALERTS & PLACEMENT RADAR API
// ======================================================

app.get("/api/alerts", async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.session?.userId || req.query.userId || null;
        const radarData = await alertService.getPlacementRadarData(userId, pool);
        res.json(radarData);
    } catch (err) {
        console.error("Error fetching career alerts:", err);
        res.status(500).json({ error: "Failed to fetch career alerts: " + err.message });
    }
});

// Trigger live web crawler sync on-demand from UI
app.post("/api/alerts/sync-live-web", async (req, res) => {
    try {
        console.log("🌐 Triggering on-demand live web crawler sync for Placement Radar...");
        const syncResult = await liveJobFetcher.syncLiveOpportunitiesFromWeb(pool);
        const userId = req.session?.user?.id || req.session?.userId || req.query.userId || null;
        const freshRadarData = await alertService.getPlacementRadarData(userId, pool);
        res.json({
            success: true,
            message: `Successfully synchronized live web feeds. ${syncResult.totalFetched || 0} opportunities checked, ${syncResult.newlyInserted || 0} newly registered.`,
            stats: syncResult,
            refreshedAt: new Date().toISOString(),
            radar: freshRadarData
        });
    } catch (err) {
        console.error("Error syncing live web alerts:", err);
        res.status(500).json({ error: "Failed to sync live web alerts: " + err.message });
    }
});

app.get("/api/alerts/:id/prep-kit", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session?.userId || req.query.userId || null;
        const radarData = await alertService.getPlacementRadarData(userId, pool);
        const alert = radarData.alerts.find(a => a.id === id);
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        res.json({
            company: alert.company,
            title: alert.title,
            night_before_prep: alert.night_before_prep,
            eligibility: alert.eligibility,
            docBagStatus: alert.docBagStatus
        });
    } catch (err) {
        console.error("Error fetching alert prep kit:", err);
        res.status(500).json({ error: "Failed to fetch prep kit: " + err.message });
    }
});

// ======================================================
// AUTOMATED PLACEMENT EMAIL RADAR & MAILBOX SIMULATOR
// ======================================================

// Update student's user-provided email destination & consent
app.post("/api/alerts/email-preferences", async (req, res) => {
    try {
        const userId = req.session?.userId || req.query.userId || null;
        const { alertEmail, emailOptIn } = req.body;
        const updated = await emailAlertService.saveEmailPreferences(userId, { alertEmail, emailOptIn }, pool);
        res.json({
            message: "Placement email alert preferences updated successfully",
            profile: updated
        });
    } catch (err) {
        console.error("Error saving email preferences:", err);
        res.status(500).json({ error: "Failed to save preferences: " + err.message });
    }
});

// Fetch simulated placement mailbox messages for current user
app.get("/api/alerts/mailbox", async (req, res) => {
    try {
        const userId = req.session?.userId || req.query.userId || null;
        const mailbox = await emailAlertService.getStudentMailbox(userId, pool);
        res.json(mailbox);
    } catch (err) {
        console.error("Error fetching placement mailbox:", err);
        res.status(500).json({ error: "Failed to fetch mailbox: " + err.message });
    }
});

// Mark an email as read
app.post("/api/alerts/mailbox/mark-read", async (req, res) => {
    try {
        const { emailId } = req.body;
        const result = await emailAlertService.markEmailAsRead(emailId, pool);
        res.json(result);
    } catch (err) {
        console.error("Error marking email as read:", err);
        res.status(500).json({ error: "Failed to mark email: " + err.message });
    }
});

// Send direct circular email briefing to candidate
app.post("/api/alerts/send-circular-email", async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.session?.userId || null;
        const { recipientEmail, examId, title, organization, deadline, salary_or_stipend, apply_url, description } = req.body;
        const targetEmail = recipientEmail || "student.demo@docmind.ai";

        const subject = `🏛️ Official Exam Circular: ${organization} - ${title}`;
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">🏛️ DocMind AI Statutory Circular Alert</h2>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Official Indian Government Recruitment Briefing</p>
                </div>
                <div style="padding: 20px 0;">
                    <h3 style="color: #1e293b; margin: 0 0 8px 0;">${title}</h3>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">Conducting Body: <strong>${organization}</strong></p>
                    
                    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 16px;">
                        <p style="margin: 4px 0; font-size: 14px;"><strong>💰 Pay Scale / Stipend:</strong> ${salary_or_stipend || "As per 7th CPC"}</p>
                        <p style="margin: 4px 0; font-size: 14px;"><strong>📅 Closing Date:</strong> ${deadline ? new Date(deadline).toLocaleDateString("en-IN") : "Refer Official Gazette"}</p>
                    </div>
                    
                    <p style="color: #334155; font-size: 14px; line-height: 1.6;">${description || "Official circular released by authority. Verify age relaxation and document checklist before applying."}</p>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="${apply_url || '#'}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                            Open Official Application Portal ↗
                        </a>
                    </div>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center;">
                    DocMind AI Career Copilot • Document Vault Verified
                </div>
            </div>
        `;

        // 1. Dispatch real email via transporter if configured
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"DocMind AI Placement Radar" <${process.env.EMAIL_USER || "noreply@docmind.ai"}>`,
                    to: targetEmail,
                    subject,
                    html: htmlBody
                });
            } catch (mailErr) {
                console.warn("[Mail Transport Notice]:", mailErr.message);
            }
        }

        // 2. Save in student's simulated placement mailbox
        await pool.query(
            `INSERT INTO placement_emails (user_id, recipient_email, alert_id, company, title, subject, html_body, urgency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId || 1,
                targetEmail,
                `govt-${examId || Date.now()}`,
                organization,
                title,
                subject,
                htmlBody,
                "critical_24h"
            ]
        );

        res.json({
            success: true,
            message: `Official circular briefing sent to ${targetEmail}`,
            recipientEmail: targetEmail
        });
    } catch (err) {
        console.error("Error sending circular email:", err);
        res.status(500).json({ error: "Failed to send circular email: " + err.message });
    }
});

// Trigger background automated email evaluation for all opted-in students
app.post("/api/alerts/trigger-email-scan", async (req, res) => {
    try {
        const result = await emailAlertService.processAutomatedBackgroundEmails(pool, alertService.SEED_CAREER_ALERTS, transporter);
        res.json({
            message: "Automated background email scan executed successfully",
            ...result
        });
    } catch (err) {
        console.error("Error running automated email scan:", err);
        res.status(500).json({ error: "Failed to run automated scan: " + err.message });
    }
});

// Background Daemon: Run automated placement email scan every 30 minutes
setInterval(async () => {
    try {
        console.log("[Background Worker] Executing automated placement email radar scan...");
        await emailAlertService.processAutomatedBackgroundEmails(pool, alertService.SEED_CAREER_ALERTS, transporter);
    } catch (bgErr) {
        console.error("[Background Email Daemon Error]:", bgErr.message);
    }
}, 30 * 60 * 1000);

// ======================================================
// TEST DATABASE
// ======================================================

app.get(
    "/test-db",

    async (req, res) => {

        try {

            const result =
                await pool.query(
                    "SELECT NOW()"
                );


            res.json({

                message:
                    "Database connected",

                time:
                    result.rows[0].now

            });

        }

        catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Database error"

            });

        }

    }

);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,

    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);