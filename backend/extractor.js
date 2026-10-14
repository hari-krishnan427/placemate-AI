const fs = require("fs");
const path = require("path");
const pdfParseModule = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

// ======================================================
// 1. UNIVERSAL TEXT EXTRACTION
// ======================================================
async function extractText(filePath, fileType, originalName) {
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found on server disk");
    }

    const ext = path.extname(originalName || filePath).toLowerCase();
    const mime = (fileType || "").toLowerCase();

    // 1. PDF Documents
    if (ext === ".pdf" || mime.includes("pdf")) {
        const fileBuffer = fs.readFileSync(filePath);
        
        // Support pdf-parse v2 (PDFParse class)
        if (pdfParseModule.PDFParse) {
            const parser = new pdfParseModule.PDFParse({ data: fileBuffer });
            const data = await parser.getText();
            return data && data.text ? data.text.trim() : "";
        }
        
        // Fallback for pdf-parse v1 (function)
        if (typeof pdfParseModule === "function") {
            const data = await pdfParseModule(fileBuffer);
            return data && data.text ? data.text.trim() : "";
        }

        // Generic constructor fallback
        const { PDFParse } = require("pdf-parse");
        const parser = new PDFParse({ data: fileBuffer });
        const data = await parser.getText();
        return data && data.text ? data.text.trim() : "";
    }

    // 2. Microsoft Word Documents (.docx)
    if (ext === ".docx" || mime.includes("wordprocessingml") || mime.includes("officedocument")) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value ? result.value.trim() : "";
    }

    // 3. Plain Text Documents (.txt, .md, .csv)
    if (ext === ".txt" || ext === ".md" || ext === ".csv" || mime.includes("text/plain")) {
        return fs.readFileSync(filePath, "utf-8").trim();
    }

    // 4. Image Documents & Scanned Photos (.png, .jpg, .jpeg, .webp) via OCR
    if (
        ext === ".png" ||
        ext === ".jpg" ||
        ext === ".jpeg" ||
        ext === ".webp" ||
        mime.startsWith("image/")
    ) {
        console.log(`Running OCR extraction on image: ${originalName}...`);
        const { data } = await Tesseract.recognize(filePath, "eng", {
            logger: (m) => {
                if (m.status === "recognizing text") {
                    // Log progress if needed
                }
            }
        });
        return data.text ? data.text.trim() : "";
    }

    throw new Error(
        `Unsupported format (${ext}). Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG.`
    );
}

// ======================================================
// 2. GEMINI AI CALLER (RESILIENT WITH NATIVE FETCH)
// ======================================================
async function callGeminiAI(prompt, apiKey) {
    if (!apiKey) {
        return null;
    }

    // Models prioritized by availability & speed:
    const models = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-3.8-flash"
    ];
    let lastError = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(35000),
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                return textResponse;
            }
        } catch (err) {
            lastError = err;
            console.warn(`Attempt with ${model} failed, trying next model...`);
        }
    }

    throw lastError || new Error("Gemini AI request failed");
}

// ======================================================
// 3. SMART RESUME ANALYZER (AI + FALLBACK)
// ======================================================
async function analyzeResumeWithAI(rawText) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
        try {
            const prompt = `
You are an expert HR recruiter and career parsing intelligence system.
Analyze the following student resume/document text carefully and extract structured information into pure, valid JSON format.

DOCUMENT TEXT:
"""
${rawText.slice(0, 15000)}
"""

REQUIREMENTS:
1. Return ONLY valid JSON with no markdown backticks, no code block fences, no explanatory text.
2. Structure must match this exact schema:
{
  "fullName": "Student's Full Name",
  "email": "student email or empty string",
  "phone": "student phone number or empty string",
  "location": "City, State or Country or empty string",
  "degree": "e.g. B.E, B.Tech, BCA, B.Sc, M.E, M.Tech, MCA or empty string",
  "branch": "e.g. Computer Science and Engineering, Information Technology, Mechanical, etc.",
  "institution": "College or University name",
  "graduationYear": 2026,
  "cgpa": 8.4,
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Intern / Developer",
      "duration": "e.g. Jan 2025 - Mar 2025",
      "description": "Brief description of responsibilities"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Short 1-2 sentence overview",
      "techStack": ["React", "Node.js", "PostgreSQL"]
    }
  ],
  "certifications": ["Cert 1", "Cert 2"]
}
`;

            const rawAiResponse = await callGeminiAI(prompt, apiKey);
            if (rawAiResponse) {
                // Strip any markdown code fences if model enclosed them
                let cleaned = rawAiResponse.trim();
                if (cleaned.startsWith("```json")) {
                    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
                } else if (cleaned.startsWith("```")) {
                    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
                }

                const parsed = JSON.parse(cleaned);
                return {
                    ...parsed,
                    extractedVia: "Gemini AI"
                };
            }
        } catch (aiErr) {
            console.error("Gemini AI extraction error, using rule-based fallback:", aiErr.message);
        }
    }

    // High-precision algorithmic parser fallback (used if API key is not yet set)
    return parseResumeHeuristically(rawText);
}

// Fallback rule-based parser when API key is not configured
function parseResumeHeuristically(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // 1. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "";

    // 2. Phone extraction
    const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6789]\d{9}/) || text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : "";

    // 3. Name (typically first non-empty line)
    let fullName = lines[0] || "Student";
    if (fullName.length > 50 || fullName.includes("@")) {
        fullName = "Student";
    }

    // 4. CGPA / Marks
    let cgpa = null;
    const cgpaMatch = text.match(/(?:cgpa|gpa|percentage|marks)[:\s]+([0-9]+(?:\.[0-9]+)?)/i);
    if (cgpaMatch) {
        cgpa = parseFloat(cgpaMatch[1]);
        if (cgpa > 10 && cgpa <= 100) {
            cgpa = parseFloat((cgpa / 10).toFixed(2));
        }
    }

    // 5. Degree & Branch
    let degree = "";
    let branch = "";
    if (/b\.?e|bachelor of engineering/i.test(text)) degree = "B.E";
    else if (/b\.?tech|bachelor of technology/i.test(text)) degree = "B.Tech";
    else if (/bca|bachelor of computer applications/i.test(text)) degree = "BCA";
    else if (/m\.?e|m\.?tech/i.test(text)) degree = "M.Tech";
    else if (/mca/i.test(text)) degree = "MCA";
    else if (/b\.?sc/i.test(text)) degree = "B.Sc";

    if (/computer science|cse/i.test(text)) branch = "Computer Science and Engineering";
    else if (/information technology|it/i.test(text)) branch = "Information Technology";
    else if (/artificial intelligence|data science|ai|ds/i.test(text)) branch = "AI & Data Science";
    else if (/electronics|ece/i.test(text)) branch = "Electronics & Communication";
    else if (/mechanical/i.test(text)) branch = "Mechanical Engineering";
    else if (/electrical|eee/i.test(text)) branch = "Electrical & Electronics";

    // 6. Graduation Year
    let graduationYear = null;
    const yearMatches = text.match(/\b(202[4-9]|2030)\b/g);
    if (yearMatches && yearMatches.length > 0) {
        graduationYear = parseInt(yearMatches[yearMatches.length - 1], 10);
    }

    // 7. Tech Skills matching from a curated dictionary
    const skillDictionary = [
        "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "PHP",
        "React", "React.js", "Node.js", "Express.js", "Express", "Angular", "Vue.js", "Next.js",
        "HTML", "HTML5", "CSS", "CSS3", "Tailwind CSS", "Bootstrap", "Redux",
        "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Firebase", "Supabase",
        "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Linux",
        "REST API", "GraphQL", "Machine Learning", "Data Analysis", "Pandas", "NumPy"
    ];

    const detectedSkills = [];
    for (const skill of skillDictionary) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i");
        if (regex.test(text)) {
            detectedSkills.push(skill);
        }
    }

    return {
        fullName,
        email,
        phone,
        location: "",
        degree,
        branch,
        institution: "",
        graduationYear: graduationYear || 2026,
        cgpa: cgpa || null,
        skills: [...new Set(detectedSkills)],
        experience: [],
        projects: [],
        certifications: [],
        extractedVia: "Rule-Based Parser (Configure GEMINI_API_KEY for Deep AI)"
    };
}

// ======================================================
// 4. DOCUMENT Q&A (OPTION C LEVEL 1)
// ======================================================
async function askDocumentAI(rawText, question, documentName) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return (
            "💡 To activate AI Document Q&A, please add your free GEMINI_API_KEY in backend/.env.\n\n" +
            "Quick Preview: Your document has " +
            rawText.length +
            " characters of extracted text."
        );
    }

    const prompt = `
You are DocMind AI, a helpful, intelligent student career assistant.
The student has uploaded a document named "${documentName}".
Answer the student's question accurately, politely, and strictly based on the text provided below.
If the information is not in the document, truthfully state that the document does not mention it.

DOCUMENT CONTENT:
"""
${rawText.slice(0, 18000)}
"""

STUDENT'S QUESTION:
"${question}"

ANSWER:
`;

    const answer = await callGeminiAI(prompt, apiKey);
    return answer ? answer.trim() : "Unable to generate answer at this time.";
}

module.exports = {
    extractText,
    analyzeResumeWithAI,
    askDocumentAI,
    callGeminiAI,
    callGeminiModel: (prompt) => callGeminiAI(prompt, process.env.GEMINI_API_KEY)
};

