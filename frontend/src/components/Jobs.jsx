import { useState, useEffect } from "react";
import { API } from "../config";

function Jobs({ setActivePage, onStartMockTest, onStartInterview, onPrepareCompany }) {
    const [matches, setMatches] = useState([]);
    const [hasProfile, setHasProfile] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Search
    const [categoryFilter, setCategoryFilter] = useState("all"); // 'all', 'job', 'internship', 'top_matches'
    const [selectedDomain, setSelectedDomain] = useState("all"); // 'all', 'core_engineering', 'commerce_finance', 'general_graduate', 'software_web'
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedOrgType, setSelectedOrgType] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [customLocation, setCustomLocation] = useState("");
    const [whatsappModalItem, setWhatsappModalItem] = useState(null);
    const [whatsappPhone, setWhatsappPhone] = useState("");
    const [whatsappSending, setWhatsappSending] = useState(false);
    const [whatsappSuccess, setWhatsappSuccess] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    // Debounce search query by 350ms to prevent freezing and enable on-demand querying
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 350);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const disciplines = [
        { id: "all", label: "All Streams 🎓" },
        { id: "core_engineering", label: "⚙️ Core Engg (Mech / Civil / EEE / ECE)" },
        { id: "commerce_finance", label: "📊 Commerce & Banking (B.Com / BBA / Finance)" },
        { id: "general_graduate", label: "🔬 Arts, Science & Operations (Any Graduate)" },
        { id: "software_web", label: "💻 Software & Tech (IT / CS)" }
    ];

    const locations = [
        { id: "all", label: "All India 🇮🇳" },
        { id: "coimbatore", label: "Coimbatore" },
        { id: "tirupur", label: "Tirupur" },
        { id: "erode", label: "Erode" },
        { id: "salem", label: "Salem" },
        { id: "hosur", label: "Hosur" },
        { id: "chennai", label: "Chennai" },
        { id: "bengaluru", label: "Bengaluru" },
        { id: "remote", label: "Remote / WFH 🌐" }
    ];

    const orgTypes = [
        { id: "all", label: "All Companies" },
        { id: "startup", label: "🚀 Fast Startups" },
        { id: "product_company", label: "💎 Product Tech" },
        { id: "mid_size", label: "⚡ Core / Mid-Market" },
        { id: "mnc", label: "🏢 Global MNCs" }
    ];

    useEffect(() => {
        fetchMatches();
    }, [selectedLocation, categoryFilter, selectedOrgType, selectedDomain, debouncedSearch]);

    const fetchMatches = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            let catParam = categoryFilter === "top_matches" ? "all" : categoryFilter;
            let url = `${API}/matches?category=${catParam}`;
            if (selectedLocation && selectedLocation !== "all") {
                url += `&location=${encodeURIComponent(selectedLocation)}`;
            }
            if (debouncedSearch && debouncedSearch.trim()) {
                url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
            }
            if (selectedOrgType !== "all") {
                url += `&organization_type=${selectedOrgType}`;
            }
            if (selectedDomain !== "all") {
                url += `&domain=${selectedDomain}`;
            }
            if (forceRefresh) {
                url += `&_t=${Date.now()}`;
            }

            let response = await fetch(url, {
                credentials: "include"
            });

            // Graceful fallback for non-authenticated exploration
            if (response.status === 401) {
                let pubUrl = `${API}/opportunities?category=${catParam}`;
                if (selectedLocation && selectedLocation !== "all") pubUrl += `&location=${encodeURIComponent(selectedLocation)}`;
                if (debouncedSearch && debouncedSearch.trim()) pubUrl += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
                if (selectedOrgType !== "all") pubUrl += `&organization_type=${selectedOrgType}`;
                if (selectedDomain !== "all") pubUrl += `&domain=${selectedDomain}`;
                if (forceRefresh) pubUrl += `&_t=${Date.now()}`;
                response = await fetch(pubUrl);
                if (response.ok) {
                    const pubData = await response.json();
                    let results = pubData.opportunities || [];
                    results = results.filter(item => item.category === "job" || item.category === "internship");
                    setMatches(results.map(r => ({ ...r, match: null })));
                    setHasProfile(false);
                    return;
                }
            }

            if (!response.ok) {
                throw new Error("Failed to load opportunities");
            }

            const data = await response.json();
            setHasProfile(data.hasProfile);
            setStudentInfo(data.studentInfo);

            let results = data.matches || [];
            results = results.filter(item => item.category === "job" || item.category === "internship");

            if (categoryFilter === "top_matches") {
                results = results.filter(item => item.match && item.match.matchScore >= 60);
            }

            setMatches(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate human-friendly time elapsed
    const getTimeAgo = (dateStr) => {
        if (!dateStr) return "Recently";
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    };

    // Direct matches from Universal Engine & DB (no artificial client blocking)
    const filteredMatches = matches;

    const handleSendWhatsApp = async () => {
        if (!whatsappModalItem) return;
        setWhatsappSending(true);
        try {
            const res = await fetch(`${API}/opportunities/${whatsappModalItem.id}/whatsapp-alert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: whatsappPhone }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.whatsappUrl) {
                window.open(data.whatsappUrl, "_blank");
                setWhatsappSuccess(true);
                setTimeout(() => {
                    setWhatsappSuccess(false);
                    setWhatsappModalItem(null);
                    setWhatsappPhone("");
                }, 1500);
            }
        } catch (err) {
            alert("Could not generate WhatsApp alert: " + err.message);
        } finally {
            setWhatsappSending(false);
        }
    };

    const handleSyncLive = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const res = await fetch(`${API}/opportunities/sync-live`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    search: searchQuery,
                    location: selectedLocation !== "all" ? selectedLocation : ""
                })
            });
            const data = await res.json();
            setSyncMessage(data.message || "Live opportunities updated from internet!");
            await fetchMatches(true);
            setTimeout(() => setSyncMessage(null), 5000);
        } catch (err) {
            alert("Live fetch error: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="jobs-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-badge">
                        <span>💼</span>
                        <span>Version 3 • Live Opportunity Engine</span>
                    </div>
                    <h1 className="page-title">Jobs & Internships Radar</h1>
                    <p className="page-subtitle">
                        Discover real-time fresher engineering openings across Chennai, Bengaluru, and Remote. 
                        Every opportunity is analyzed with your authentic profile for match score and skill gaps.
                    </p>
                </div>

                <div className="header-actions-group">
                    <button 
                        className={`btn btn-sync-live ${isSyncing ? "btn-syncing" : ""}`}
                        onClick={handleSyncLive}
                        disabled={isSyncing}
                        title="Scan the internet for new live job postings and circulars"
                    >
                        <span className={`sync-icon ${isSyncing ? "spinning" : ""}`}>🔄</span>
                        <span>{isSyncing ? "Scanning Live Web..." : "Fetch Live from Web"}</span>
                    </button>

                    {hasProfile && studentInfo && (
                        <div className="student-profile-chip">
                            <div className="chip-avatar">🎯</div>
                            <div className="chip-text">
                                <strong>Matching for: {studentInfo.degree || "Student"} ({studentInfo.graduationYear || 2026})</strong>
                                <span>{studentInfo.skillsCount || 0} verified skills loaded</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sync Notification Banner */}
            {syncMessage && (
                <div className="sync-notification-toast">
                    <span>⚡</span>
                    <span>{syncMessage}</span>
                </div>
            )}

            {/* Profile CTA if not extracted */}
            {!hasProfile && (
                <div className="profile-nudge-banner">
                    <div className="nudge-icon">🧠</div>
                    <div className="nudge-body">
                        <h3>Unlock Your Personal AI Match Score & Skill Gaps</h3>
                        <p>
                            You haven't extracted your resume yet. Upload your resume or transcript in the 
                            Document Vault to unlock 1-click eligibility checks and see exact missing skills!
                        </p>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setActivePage("Documents")}
                    >
                        📁 Go to Vault & Extract Resume
                    </button>
                </div>
            )}

            {/* Top Filter Controls */}
            <div className="jobs-controls-card">
                {/* Search Bar */}
                <div className="jobs-search-row">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by role, company (e.g. Zoho, Chargebee), or skill (e.g. React, C++)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>
                        )}
                    </div>

                    {/* Category Tabs */}
                    <div className="category-pill-group">
                        <button
                            className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("all")}
                        >
                            All Roles
                        </button>
                        <button
                            className={`filter-pill ${categoryFilter === "job" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("job")}
                        >
                            Full-Time Fresher
                        </button>
                        <button
                            className={`filter-pill ${categoryFilter === "internship" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("internship")}
                        >
                            Internships
                        </button>
                        {hasProfile && (
                            <button
                                className={`filter-pill highlight-pill ${categoryFilter === "top_matches" ? "active" : ""}`}
                                onClick={() => setCategoryFilter("top_matches")}
                            >
                                🔥 Top Matches (60%+)
                            </button>
                        )}
                    </div>
                </div>

                {/* Academic Discipline / Stream Filter */}
                <div className="discipline-filter-row" style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                    <span className="filter-label" style={{ fontWeight: 600, color: "var(--text-muted, #94a3b8)", marginRight: "0.75rem", fontSize: "0.85rem" }}>🎓 Student Stream:</span>
                    <div className="discipline-pills" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {disciplines.map((d) => (
                            <button
                                key={d.id}
                                className={`loc-pill ${selectedDomain === d.id ? "active" : ""}`}
                                onClick={() => setSelectedDomain(d.id)}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location Filter Pills + Open Custom City Radar */}
                <div className="location-filter-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                    <span className="filter-label">📍 Location Radar:</span>
                    <div className="location-pills">
                        {locations.map((loc) => (
                            <button
                                key={loc.id}
                                className={`loc-pill ${selectedLocation === loc.id && !customLocation ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedLocation(loc.id);
                                    setCustomLocation("");
                                }}
                            >
                                {loc.label}
                            </button>
                        ))}
                    </div>
                    {/* Open Custom City Input (Interior Hubs, Taluks & Districts) */}
                    <div className="custom-location-box" style={{ display: "inline-flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "3px 12px", gap: "6px" }}>
                        <span style={{ fontSize: "12px" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Any district (e.g. Tirupur, Erode, Salem)..."
                            value={customLocation}
                            onChange={(e) => {
                                setCustomLocation(e.target.value);
                                if (e.target.value.trim().length > 1) {
                                    setSelectedLocation(e.target.value.trim().toLowerCase());
                                } else if (e.target.value.trim().length === 0) {
                                    setSelectedLocation("all");
                                }
                            }}
                            style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "190px", color: "#1e293b" }}
                        />
                        {customLocation && (
                            <button 
                                onClick={() => { setCustomLocation(""); setSelectedLocation("all"); }}
                                style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", fontSize: "11px", fontWeight: "bold" }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Company Type Filter */}
                <div className="org-filter-row">
                    <span className="filter-label">🏢 Employer Type:</span>
                    <div className="org-pills">
                        {orgTypes.map((org) => (
                            <button
                                key={org.id}
                                className={`org-pill ${selectedOrgType === org.id ? "active" : ""}`}
                                onClick={() => setSelectedOrgType(org.id)}
                            >
                                {org.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Opportunities List State */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>
                        {debouncedSearch 
                            ? `⚡ Scanning live streams (LinkedIn, Internshala, Freshersworld, NCS) for "${debouncedSearch}"...` 
                            : "Scanning real-time multi-engine opportunity feed and calculating match scores..."}
                    </p>
                </div>
            ) : error ? (
                <div className="error-card">
                    <p>⚠️ {error}</p>
                    <button className="btn btn-secondary" onClick={fetchMatches}>Try Again</button>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">💼</div>
                    <h3>No openings match your current filter</h3>
                    <p>Try clearing your location or search query to explore more opportunities.</p>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => {
                            setSelectedLocation("all");
                            setSelectedOrgType("all");
                            setCategoryFilter("all");
                            setSearchQuery("");
                        }}
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="jobs-grid">
                    {filteredMatches.map((item) => {
                        const match = item.match || {};
                        const matchScore = match.matchScore || 0;
                        const isEligible = match.isEligible !== false;
                        const hasScore = hasProfile && match.hasProfile !== false;

                        return (
                            <div 
                                key={item.id} 
                                className={`job-card ${hasScore && matchScore >= 75 && isEligible ? "featured-card" : ""}`}
                            >
                                {/* Top Header: Company + Timestamps */}
                                <div className="job-card-header">
                                    <div className="company-info">
                                        <div className="company-logo-placeholder">
                                            {item.organization ? item.organization.substring(0, 2).toUpperCase() : "CO"}
                                        </div>
                                        <div>
                                            <h4 className="company-name">{item.organization}</h4>
                                            <div className="company-sub-meta">
                                                <span className="org-type-tag">
                                                    {item.organization_type === "startup" ? "🚀 Startup" :
                                                     item.organization_type === "product_company" ? "💎 Product Co" :
                                                     item.organization_type === "mnc" ? "🏢 Global MNC" : "⚡ Engineering"}
                                                </span>
                                                <span className="source-tag" style={{ fontSize: "11px", color: "#4f46e5", background: "#eef2ff", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                                    {item.source ? `🌐 ${item.source}` : "🌐 Verified Stream"}
                                                </span>
                                                <span className="posted-time">
                                                    🟢 {getTimeAgo(item.posted_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Match Gauge */}
                                    {hasScore && (
                                        <div className="match-gauge-wrapper">
                                            <div className={`match-badge ${matchScore >= 75 ? "match-high" : matchScore >= 50 ? "match-medium" : "match-low"}`}>
                                                <span className="match-pct">{matchScore}%</span>
                                                <span className="match-lbl">Match</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Job Title */}
                                <h3 className="job-title">{item.title}</h3>

                                {/* Quick Details Badges */}
                                <div className="job-meta-chips">
                                    <span className="meta-chip stream-chip" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)", fontWeight: 600 }}>
                                        {item.domain === "core_engineering" ? "⚙️ Core Engg" :
                                         item.domain === "commerce_finance" ? "📊 Commerce & Banking" :
                                         item.domain === "general_graduate" ? "🔬 Arts, Science & Ops" : "💻 Software & Tech"}
                                    </span>
                                    <span className="meta-chip degree-chip" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                                        🎓 {Array.isArray(item.eligible_degrees) && item.eligible_degrees.length > 0 
                                            ? item.eligible_degrees[0] 
                                            : "Any Graduate"}
                                    </span>
                                    <span className="meta-chip">
                                        📍 {item.location} ({item.work_mode || "On-site"})
                                    </span>
                                    <span className="meta-chip highlight-chip">
                                        💰 {item.salary_or_stipend || "Competitive"}
                                    </span>
                                    <span className="meta-chip">
                                        📅 {Array.isArray(item.eligible_years) && item.eligible_years.length > 0 
                                            ? `Batch: ${item.eligible_years.join("/")}` 
                                            : "All Batches"}
                                    </span>
                                </div>

                                {/* Eligibility Status */}
                                {hasScore && (
                                    <div className="eligibility-status-banner">
                                        {isEligible ? (
                                            <div className="eligible-pill">
                                                <span>✅</span>
                                                <span>Eligible to Apply</span>
                                                {match.eligibilityNotes && match.eligibilityNotes[0] && (
                                                    <span className="eligibility-subnote">• {match.eligibilityNotes[0]}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="ineligible-pill">
                                                <span>⚠️</span>
                                                <span>Criteria Mismatch</span>
                                                {match.ineligibilityReasons && match.ineligibilityReasons[0] && (
                                                    <span className="eligibility-subnote">• {match.ineligibilityReasons[0]}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Skills Section: Matched vs Missing */}
                                <div className="skills-match-section">
                                    {hasScore && match.matchedSkills && match.matchedSkills.length > 0 && (
                                        <div className="skill-group">
                                            <span className="skill-group-title">✅ Skills You Have:</span>
                                            <div className="skill-tags">
                                                {match.matchedSkills.map((sk, idx) => (
                                                    <span key={idx} className="tag tag-matched">{sk}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {hasScore && match.skillGaps && match.skillGaps.length > 0 && (
                                        <div className="skill-group">
                                            <span className="skill-group-title">⚠️ Skills to Learn (Gap):</span>
                                            <div className="skill-tags">
                                                {match.skillGaps.map((sk, idx) => (
                                                    <span key={idx} className="tag tag-gap">+{sk}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback if no profile: show required skills */}
                                    {!hasScore && Array.isArray(item.required_skills) && (
                                        <div className="skill-group">
                                            <span className="skill-group-title">Key Skills:</span>
                                            <div className="skill-tags">
                                                {item.required_skills.map((sk, idx) => (
                                                    <span key={idx} className="tag tag-neutral">{sk}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="job-description">
                                    {item.description || "Exciting engineering role with real-world impact and competitive career progression."}
                                </p>

                                {/* Card Footer: Actions */}
                                <div className="job-card-footer">
                                    <div className="deadline-notice">
                                        <div className="deadline-left">
                                            <span className="deadline-icon">⏳</span>
                                            <span>
                                                {item.deadline 
                                                    ? `Apply by ${new Date(item.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` 
                                                    : "Open until filled"}
                                            </span>
                                        </div>
                                        <span className="deadline-status-pill">⚡ Active Hiring</span>
                                    </div>

                                    <div className="job-card-actions-container">
                                        {/* Tier 1: Primary Apply & WhatsApp */}
                                        <div className="card-primary-actions-row">
                                            <a
                                                href={item.apply_url || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-apply-full"
                                                title="Open official company application portal"
                                            >
                                                <span>🚀 Apply Directly</span>
                                                <span className="apply-arrow">↗</span>
                                            </a>

                                            <button
                                                type="button"
                                                className="btn-whatsapp-compact"
                                                title="Send job details to your WhatsApp"
                                                onClick={() => setWhatsappModalItem(item)}
                                            >
                                                <span>📲</span>
                                                <span>Share</span>
                                            </button>
                                        </div>

                                        {/* Tier 2: Instant Company Placement Prep */}
                                        <div className="card-prep-actions-row">
                                            <button
                                                type="button"
                                                className="btn-card-prep-mock"
                                                title={`Take Authentic Mock Assessment tailored for ${item.organization} (${item.title})`}
                                                onClick={() => {
                                                    if (onStartMockTest) onStartMockTest(item.organization, item.title);
                                                    else if (onPrepareCompany) onPrepareCompany(item.organization);
                                                }}
                                            >
                                                <span>📝</span>
                                                <span>Mock Test</span>
                                                <span className="card-prep-tag">Exam</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-card-prep-interview"
                                                title={`Practice Real-Time Voice AI Interview for ${item.organization} (${item.title})`}
                                                onClick={() => {
                                                    if (onStartInterview) onStartInterview(item.organization, item.title);
                                                    else if (onPrepareCompany) onPrepareCompany(item.organization);
                                                }}
                                            >
                                                <span>🎙️</span>
                                                <span>AI Interview</span>
                                                <span className="card-prep-tag">Voice</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* WhatsApp Share / Alert Modal */}
            {whatsappModalItem && (
                <div className="modal-backdrop">
                    <div className="modal-card modal-small">
                        <div className="modal-header">
                            <h3>📲 Send Opportunity to WhatsApp</h3>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setWhatsappModalItem(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-lead-text">
                                Send <strong>{whatsappModalItem.title}</strong> at <strong>{whatsappModalItem.organization}</strong> directly to your phone or study group:
                            </p>

                            <div className="whatsapp-preview-card">
                                <strong>🚀 {whatsappModalItem.title}</strong>
                                <span>🏢 {whatsappModalItem.organization} • 📍 {whatsappModalItem.location}</span>
                                <span>💰 {whatsappModalItem.salary_or_stipend}</span>
                            </div>

                            <div className="form-group">
                                <label>Enter WhatsApp Number (optional, with country code e.g. +91):</label>
                                <input
                                    type="text"
                                    placeholder="+91 98765 43210 (Leave blank to share to any chat)"
                                    value={whatsappPhone}
                                    onChange={(e) => setWhatsappPhone(e.target.value)}
                                    className="form-input"
                                />
                                <span className="form-tip">Leave blank to open WhatsApp and pick any friend or group.</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setWhatsappModalItem(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary btn-whatsapp-submit"
                                onClick={handleSendWhatsApp}
                                disabled={whatsappSending}
                            >
                                {whatsappSending ? "Opening WhatsApp..." : whatsappSuccess ? "✅ Opened!" : "Open in WhatsApp ↗"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Jobs;
