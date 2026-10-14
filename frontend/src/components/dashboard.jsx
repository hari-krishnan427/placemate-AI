import { useState, useEffect } from "react";

import { API } from "../config";

function Dashboard({ setActivePage, user }) {
    const [docStats, setDocStats] = useState({
        total: 0,
        resume: 0,
        marksheet: 0,
        certificate: 0,
        id_proof: 0,
        other: 0
    });
    const [recentDocs, setRecentDocs] = useState([]);
    const [matchStats, setMatchStats] = useState({
        total_opportunities: 0,
        highMatchCount: 0,
        urgent_exams: 0
    });
    const [topRecommendations, setTopRecommendations] = useState([]);
    const [hasExtractedProfile, setHasExtractedProfile] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Fetch document stats
                const docRes = await fetch(`${API}/documents`, {
                    credentials: "include"
                });
                if (docRes.ok) {
                    const data = await docRes.json();
                    if (data.stats) {
                        setDocStats(data.stats);
                    }
                    if (data.documents) {
                        setRecentDocs(data.documents.slice(0, 3));
                    }
                }

                // Fetch match & opportunity stats
                const matchRes = await fetch(`${API}/matches/stats`, {
                    credentials: "include"
                });
                if (matchRes.ok) {
                    const matchData = await matchRes.json();
                    setHasExtractedProfile(matchData.hasProfile);
                    if (matchData.stats) {
                        setMatchStats(matchData.stats);
                    }
                    if (matchData.topRecommendations) {
                        setTopRecommendations(matchData.topRecommendations);
                    }
                }
            } catch (err) {
                console.error("Dashboard data load error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const hasResume = (docStats.resume || 0) > 0;
    const userDisplayName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Student");

    return (
        <div className="dashboard-container">
            {/* Hero Welcome Banner */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <div className="hero-tag">🎯 Final-Year Career Command Center</div>
                    <h1 className="hero-title">
                        Welcome, <span className="highlight-text">{userDisplayName}</span>!
                    </h1>
                    <p className="hero-desc">
                        Your documents, job matching, government exam radars, and AI career guidance — all unified in one intelligent dashboard.
                    </p>

                    <div className="hero-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => setActivePage("Documents")}
                        >
                            <span>📁</span> Open Document Vault
                        </button>
                        <button
                            className="btn btn-secondary-hero"
                            onClick={() => setActivePage("AI Assistant")}
                        >
                            <span>🤖</span> Talk to Career AI
                        </button>
                    </div>
                </div>

                <div className="hero-badge-card">
                    <div className="vault-status-indicator">
                        <span className="status-dot-pulse"></span>
                        <span>Vault Status: Active</span>
                    </div>
                    <div className="hero-stat-large">
                        {loading ? "..." : docStats.total}
                    </div>
                    <div className="hero-stat-caption">Securely Stored Documents</div>
                    <div className="hero-stat-progress">
                        <div
                            className="progress-bar-fill"
                            style={{ width: hasResume ? "100%" : "30%" }}
                        ></div>
                    </div>
                    <span className="progress-hint">
                        {hasResume
                            ? "✅ Resume loaded for AI matching"
                            : "⚠️ Upload resume to activate matching"}
                    </span>
                </div>
            </div>

            {/* High Priority Opportunity & Exam Radar Widget */}
            <div className="priority-radar-section">
                <div className="section-header-row">
                    <div>
                        <div className="section-eyebrow">
                            <span>🔥</span>
                            <span>Live High-Priority Radar</span>
                        </div>
                        <h2 className="section-main-title">Top Recommended Opportunities</h2>
                    </div>

                    <div className="radar-stats-chips">
                        <span className="stat-chip">
                            💼 <strong>{matchStats.total_opportunities || 12}</strong> Live Openings
                        </span>
                        {hasExtractedProfile && (
                            <span className="stat-chip highlight-chip">
                                🎯 <strong>{matchStats.highMatchCount || 0}</strong> High Fits (75%+)
                            </span>
                        )}
                        {matchStats.urgent_exams > 0 && (
                            <span className="stat-chip urgent-chip">
                                ⏳ <strong>{matchStats.urgent_exams}</strong> Exam Closing Soon!
                            </span>
                        )}
                    </div>
                </div>

                {/* Urgent Exam Alert Ticker if closing in <= 7 days */}
                {matchStats.urgent_exams > 0 && (
                    <div 
                        className="urgent-alert-ticker"
                        onClick={() => setActivePage("Government Exams")}
                    >
                        <span className="ticker-badge">⏳ URGENT ALERT</span>
                        <span className="ticker-text">
                            <strong>RRB NTPC (Railway Recruitment)</strong> application deadline closes in <strong>5 days</strong>! Check syllabus, stages, and official portal.
                        </span>
                        <span className="ticker-link">Open Govt Exam Radar →</span>
                    </div>
                )}

                {/* Top Recommendations Cards Grid */}
                {hasExtractedProfile && topRecommendations.length > 0 ? (
                    <div className="top-matches-grid">
                        {topRecommendations.map((item) => (
                            <div key={item.id} className="top-match-card">
                                <div className="top-match-header">
                                    <div className="top-match-org">
                                        <span className="top-match-logo">
                                            {item.organization ? item.organization.substring(0, 2).toUpperCase() : "CO"}
                                        </span>
                                        <div>
                                            <h4>{item.organization}</h4>
                                            <span className="top-match-loc">📍 {item.location}</span>
                                        </div>
                                    </div>
                                    <div className="top-match-score-badge">
                                        {item.match?.matchScore || 80}% Fit
                                    </div>
                                </div>

                                <h3 className="top-match-title">{item.title}</h3>

                                <div className="top-match-tags">
                                    <span className="mini-chip">{item.salary_or_stipend}</span>
                                    <span className="mini-chip">
                                        {item.category === "internship" ? "Summer Internship" : "Full-Time Fresher"}
                                    </span>
                                </div>

                                <div className="top-match-footer">
                                    <span className="posted-tiny">
                                        🟢 Live opening
                                    </span>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={() => setActivePage(item.category === "government_exam" ? "Government Exams" : "Jobs")}
                                    >
                                        Inspect & Apply →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-radar-card">
                        <div className="empty-radar-content">
                            <span className="empty-radar-icon">🧠</span>
                            <div>
                                <h4>No Personalized Matches Yet</h4>
                                <p>
                                    Upload and extract your resume in the Vault to unlock your personalized 
                                    high-priority job matches, compatibility scores, and skill gap roadmaps!
                                </p>
                            </div>
                        </div>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setActivePage("Documents")}
                        >
                            📁 Go to Vault & Extract Resume
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Action Cards */}
            <div className="dashboard-cards-grid">
                {/* Card 1: Document Vault */}
                <div
                    className="dash-card interactive-card"
                    onClick={() => setActivePage("Documents")}
                >
                    <div className="dash-card-header">
                        <div className="dash-card-icon icon-blue">📁</div>
                        <span className="dash-card-pill">Vault v1</span>
                    </div>
                    <h3 className="dash-card-title">Career Document Vault</h3>
                    <p className="dash-card-text">
                        {docStats.total === 0
                            ? "Upload your resumes, marksheets, and certificates to get started."
                            : `${docStats.total} files stored (${docStats.resume} resumes, ${docStats.marksheet} marksheets, ${docStats.certificate} certs).`}
                    </p>
                    <div className="dash-card-footer">
                        <span className="footer-action-link">Manage Vault →</span>
                    </div>
                </div>

                {/* Card 2: AI Job Matching */}
                <div
                    className="dash-card interactive-card"
                    onClick={() => setActivePage("Jobs")}
                >
                    <div className="dash-card-header">
                        <div className="dash-card-icon icon-green">💼</div>
                        <span className="dash-card-pill">24/7 Scanner</span>
                    </div>
                    <h3 className="dash-card-title">Job & Internship Matches</h3>
                    <p className="dash-card-text">
                        {hasResume
                            ? "Resume scanned! Check high-scoring fresher tech and core roles tailored to your stack."
                            : "Upload your resume in Vault to calculate eligibility scores & find matching roles."}
                    </p>
                    <div className="dash-card-footer">
                        <span className="footer-action-link">Explore Opportunities →</span>
                    </div>
                </div>

                {/* Card 3: Government Exams Radar */}
                <div
                    className="dash-card interactive-card"
                    onClick={() => setActivePage("Government Exams")}
                >
                    <div className="dash-card-header">
                        <div className="dash-card-icon icon-purple">🏛️</div>
                        <span className="dash-card-pill">All-India</span>
                    </div>
                    <h3 className="dash-card-title">Government Exams Radar</h3>
                    <p className="dash-card-text">
                        Never miss an application deadline for SSC CGL, RRB, Banking/IBPS, UPSC, or State PSCs.
                    </p>
                    <div className="dash-card-footer">
                        <span className="footer-action-link">View Exam Deadlines →</span>
                    </div>
                </div>

                {/* Card 4: AI Career Mentor */}
                <div
                    className="dash-card interactive-card"
                    onClick={() => setActivePage("AI Assistant")}
                >
                    <div className="dash-card-header">
                        <div className="dash-card-icon icon-amber">🤖</div>
                        <span className="dash-card-pill">24/7 Mentor</span>
                    </div>
                    <h3 className="dash-card-title">Career AI Assistant</h3>
                    <p className="dash-card-text">
                        Ask questions about interview patterns, crack strategies for target companies, and skill roadmaps.
                    </p>
                    <div className="dash-card-footer">
                        <span className="footer-action-link">Ask AI Mentor →</span>
                    </div>
                </div>
            </div>

            {/* Two Column Layout: Student Checklist & Recent Vault Files */}
            <div className="dashboard-columns">
                {/* Column 1: Action Checklist */}
                <div className="dash-section-card">
                    <div className="section-card-header">
                        <h3>📋 Final-Year Student Career Checklist</h3>
                        <span className="badge-steps">4 Steps to Crack Placements</span>
                    </div>
                    <ul className="checklist">
                        <li className="checklist-item done">
                            <span className="checklist-icon">✅</span>
                            <div>
                                <strong>Create DocMind AI Account</strong>
                                <p>Secured with two-factor email OTP authentication.</p>
                            </div>
                        </li>
                        <li className={`checklist-item ${hasResume ? "done" : "pending"}`}>
                            <span className="checklist-icon">{hasResume ? "✅" : "⏳"}</span>
                            <div>
                                <strong>Upload Latest Resume in Vault</strong>
                                <p>Essential for AI skill extraction and automatic match scoring.</p>
                                {!hasResume && (
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => setActivePage("Documents")}
                                    >
                                        Upload Resume Now
                                    </button>
                                )}
                            </div>
                        </li>
                        <li className="checklist-item pending">
                            <span className="checklist-icon">⏳</span>
                            <div>
                                <strong>Store Marksheets & Certifications</strong>
                                <p>Keep semester grade sheets and ID proofs ready for 1-click verification.</p>
                            </div>
                        </li>
                        <li className="checklist-item pending">
                            <span className="checklist-icon">⏳</span>
                            <div>
                                <strong>Configure WhatsApp Career Alerts</strong>
                                <p>Get pinged on WhatsApp the moment an 85%+ matching job or exam deadline opens.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Column 2: Recent Vault Files */}
                <div className="dash-section-card">
                    <div className="section-card-header">
                        <h3>📁 Recent Vault Documents</h3>
                        <button
                            className="btn-text-link"
                            onClick={() => setActivePage("Documents")}
                        >
                            View All ({docStats.total})
                        </button>
                    </div>

                    {loading ? (
                        <p className="muted-text">Loading vault contents...</p>
                    ) : recentDocs.length === 0 ? (
                        <div className="empty-mini-state">
                            <span className="empty-mini-icon">📂</span>
                            <p>No documents uploaded yet.</p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setActivePage("Documents")}
                            >
                                + Upload First Document
                            </button>
                        </div>
                    ) : (
                        <div className="recent-docs-list">
                            {recentDocs.map((doc) => (
                                <div key={doc.id} className="recent-doc-row">
                                    <div className="recent-doc-info">
                                        <span className="recent-doc-icon">
                                            {(doc.file_type || "").includes("pdf")
                                                ? "📕"
                                                : (doc.file_type || "").includes("image")
                                                ? "🖼️"
                                                : "📄"}
                                        </span>
                                        <div>
                                            <div className="recent-doc-name" title={doc.original_name || doc.filename}>
                                                {doc.original_name || doc.filename}
                                            </div>
                                            <div className="recent-doc-meta">
                                                <span className="category-tag-mini">{doc.category}</span>
                                                <span>•</span>
                                                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`${API}/documents/${doc.id}/download`}
                                        className="btn-download-mini"
                                        title="Download"
                                        download
                                    >
                                        ⬇️
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;