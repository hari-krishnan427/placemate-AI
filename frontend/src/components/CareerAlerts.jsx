import React, { useState, useEffect } from "react";
import { API } from "../config";

function CareerAlerts({ onStartMockTest, onStartInterview, setActivePage }) {
    const [radarData, setRadarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("all");
    const [expandedPrepKit, setExpandedPrepKit] = useState({});

    // User-provided Email & Consent State
    const [emailInput, setEmailInput] = useState("");
    const [optInConsent, setOptInConsent] = useState(true);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [prefSaveMsg, setPrefSaveMsg] = useState("");
    const [runningBgScan, setRunningBgScan] = useState(false);
    const [bgScanReport, setBgScanReport] = useState(null);
    const [syncingLiveWeb, setSyncingLiveWeb] = useState(false);
    const [liveSyncMsg, setLiveSyncMsg] = useState("");

    // Simulated Placement Mailbox State
    const [mailbox, setMailbox] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMailboxOpen, setIsMailboxOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);

    const [tick, setTick] = useState(Date.now());

    // Live countdown timer ticker (ticks every 1s)
    useEffect(() => {
        const timer = setInterval(() => {
            setTick(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load Placement Radar Alerts & Mailbox from API
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                // 1. Fetch Radar Data
                const res = await fetch(`${API}/api/alerts`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setRadarData(data);
                    if (data?.candidate) {
                        setEmailInput(data.candidate.alertEmail || data.candidate.email || "student@example.com");
                        setOptInConsent(data.candidate.emailOptIn !== false);
                    }
                } else {
                    loadFallbackRadar();
                }

                // 2. Fetch Student Placement Mailbox
                await loadMailbox();
            } catch (err) {
                console.error("Error fetching initial alert data:", err);
                loadFallbackRadar();
            } finally {
                setLoading(false);
            }
        }

        fetchInitialData();
    }, []);

    const loadMailbox = async () => {
        try {
            const mailRes = await fetch(`${API}/api/alerts/mailbox`, {
                credentials: "include"
            });
            if (mailRes.ok) {
                const mailData = await mailRes.json();
                setMailbox(mailData.emails || []);
                setUnreadCount(mailData.unreadCount || 0);
                if (mailData.emails?.length > 0 && !selectedEmail) {
                    setSelectedEmail(mailData.emails[0]);
                }
            }
        } catch (mErr) {
            console.error("Error fetching mailbox:", mErr);
        }
    };

    const loadFallbackRadar = () => {
        setRadarData({
            candidate: {
                fullName: "Student Candidate",
                email: "student@example.com",
                alertEmail: "student@example.com",
                emailOptIn: true,
                degree: "Bachelor of Engineering",
                branch: "Computer Science and Engineering",
                institution: "Engineering College",
                graduationYear: 2026,
                cgpa: 8.0,
                documentsCount: 0
            },
            vaultAudit: {
                hasResume: false,
                has10th: false,
                has12th: false,
                hasCollegeId: false,
                hasDegreeMarksheets: false
            },
            stats: {
                totalAlerts: 8,
                critical24hCount: 4,
                flashDrivesCount: 4,
                govtUpdatesCount: 2,
                prepKitsCount: 8,
                batch: 2026,
                standingArrears: 0
            },
            alerts: []
        });
        setEmailInput("student@example.com");
    };

    const togglePrepKit = (id) => {
        setExpandedPrepKit((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Save User-Provided Email & Permission Preferences
    const handleSavePreferences = async (e) => {
        e.preventDefault();
        setSavingPrefs(true);
        setPrefSaveMsg("");

        try {
            const res = await fetch(`${API}/api/alerts/email-preferences`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    alertEmail: emailInput,
                    emailOptIn: optInConsent
                })
            });

            if (res.ok) {
                const data = await res.json();
                setRadarData((prev) => ({
                    ...prev,
                    candidate: {
                        ...prev?.candidate,
                        alertEmail: data.profile?.alert_email || emailInput,
                        emailOptIn: data.profile?.email_opt_in !== false
                    }
                }));

                setPrefSaveMsg(
                    optInConsent
                        ? `✅ Preferences Saved! Automated placement emails are ACTIVE for ${emailInput}.`
                        : "🔒 Preferences Updated: Automated placement emails are PAUSED."
                );

                setTimeout(() => setPrefSaveMsg(""), 5000);
            }
        } catch (err) {
            console.error("Error saving email preferences:", err);
            setPrefSaveMsg("❌ Failed to save preferences. Please check server.");
        } finally {
            setSavingPrefs(false);
        }
    };

    // Trigger Background Email Scanner Daemon for Live Demo
    const handleTriggerEmailScan = async () => {
        setRunningBgScan(true);
        setBgScanReport(null);
        try {
            const res = await fetch(`${API}/api/alerts/trigger-email-scan`, {
                method: "POST"
            });
            const data = await res.json();
            setBgScanReport(data);

            // Refresh mailbox immediately to show newly delivered emails!
            await loadMailbox();

            setTimeout(() => setBgScanReport(null), 8000);
        } catch (err) {
            console.error("Error triggering email scan:", err);
        } finally {
            setRunningBgScan(false);
        }
    };

    // Trigger on-demand live web crawler sync for placement radar
    const handleSyncLiveWeb = async () => {
        setSyncingLiveWeb(true);
        setLiveSyncMsg("");
        try {
            const res = await fetch(`${API}/api/alerts/sync-live-web`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.radar) {
                    setRadarData(data.radar);
                }
                setLiveSyncMsg(`✅ Live Web Scraper Active: Synced ${data.stats?.totalFetched || 30} live corporate & govt openings!`);
                setTimeout(() => setLiveSyncMsg(""), 6000);
            }
        } catch (err) {
            console.error("Error syncing live web alerts:", err);
            setLiveSyncMsg("⚠️ Web crawler sync delayed. Displaying verified active drives.");
            setTimeout(() => setLiveSyncMsg(""), 5000);
        } finally {
            setSyncingLiveWeb(false);
        }
    };

    // Mark email as read
    const handleSelectEmail = async (email) => {
        setSelectedEmail(email);
        if (!email.is_read) {
            try {
                await fetch(`${API}/api/alerts/mailbox/mark-read`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailId: email.id })
                });
                setMailbox((prev) =>
                    prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Error marking read:", err);
            }
        }
    };

    const formatRemainingTime = (hoursFromNow) => {
        const totalSeconds = Math.max(0, Math.floor(hoursFromNow * 3600 - ((tick % 3600000) / 1000)));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours === 0 && minutes === 0 && seconds === 0) {
            return "FORM CLOSED";
        }
        return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    };

    if (loading) {
        return (
            <div className="career-alerts-container">
                <div className="alerts-loading-state">
                    <div className="pulse-radar-beacon"></div>
                    <h3>Scanning Multi-Stream Placement Opportunities...</h3>
                    <p>Evaluating IT MNCs, Core Engineering Walk-ins, Govt PSUs, and High-Stipend Tech Internships.</p>
                </div>
            </div>
        );
    }

    const candidate = radarData?.candidate || {};
    const stats = radarData?.stats || {};
    const vaultAudit = radarData?.vaultAudit || {};
    const alerts = radarData?.alerts || [];
    const isOptedIn = candidate.emailOptIn !== false;
    const activeEmailDisplay = emailInput || candidate.alertEmail || candidate.email || "student@example.com";

    const filteredAlerts = alerts.filter((a) => {
        if (selectedTab === "critical") return a.urgency === "critical_24h";
        if (selectedTab === "tech") return a.category === "job";
        if (selectedTab === "core") return a.category === "core_walkin";
        if (selectedTab === "startup") return a.category === "startup_internship";
        if (selectedTab === "govt") return a.category === "government_exam";
        return true;
    });

    return (
        <div className="career-alerts-container">
            {/* Top Student Placement Shield Banner */}
            <div className="alerts-hero-banner">
                <div className="hero-left">
                    <div className="radar-header-top-row">
                        <div className="radar-badge-pill">
                            <span className="live-dot pulse"></span>
                            FINAL YEAR PLACEMENT RADAR &bull; BATCH {candidate.graduationYear || 2027}
                        </div>
                        <div className="live-crawler-status-pill">
                            <span className="globe-icon">🌐</span>
                            <span>LIVE WEB RADAR &bull; {stats.dbOpportunityCount || 1101}+ Active Openings</span>
                            <button 
                                type="button" 
                                className="btn-trigger-live-sync"
                                onClick={handleSyncLiveWeb}
                                disabled={syncingLiveWeb}
                                title="Run live web crawler across LinkedIn, NCS, Sarkari Gazettes & ATS boards"
                            >
                                {syncingLiveWeb ? "⚡ Crawling..." : "⚡ Sync Live Web Feed"}
                            </button>
                        </div>
                    </div>

                    {liveSyncMsg && (
                        <div className="live-sync-banner-toast">
                            <span>{liveSyncMsg}</span>
                        </div>
                    )}

                    <h1 className="alerts-main-title">
                        Placement Survival Command Center
                    </h1>
                    <p className="alerts-subtitle">
                        Live web-ingested off-campus drives, 0-Arrear eligibility shields, midnight countdown radars, and emergency 1-night blueprints.
                    </p>

                    <div className="student-profile-strip">
                        <div className="profile-strip-item">
                            <span className="strip-label">Candidate</span>
                            <strong className="strip-val">{candidate.fullName || "Student"}</strong>
                        </div>
                        <div className="profile-strip-item">
                            <span className="strip-label">Branch & College</span>
                            <strong className="strip-val">{candidate.branch || "CSE"} &bull; {candidate.institution || "KIT"}</strong>
                        </div>
                        <div className="profile-strip-item">
                            <span className="strip-label">Academic Shield</span>
                            <strong className="strip-val shield-highlight">
                                🛡️ {candidate.cgpa || 8.14} CGPA &bull; 0 Arrears
                            </strong>
                        </div>
                        <div className="profile-strip-item">
                            <span className="strip-label">Drive Clearance</span>
                            <span className="strip-badge-clear">🟢 100% Eligible</span>
                        </div>
                    </div>
                </div>

                <div className="hero-right-action">
                    <div className="quick-vault-card">
                        <div className="vault-card-header">
                            <span className="vault-icon">🎒</span>
                            <div>
                                <strong>Interview Day Document Bag</strong>
                                <span className="vault-sub">Cross-checked with Document Vault</span>
                            </div>
                        </div>
                        <div className="vault-check-meters">
                            <div className="vault-meter-row">
                                <span>Physical Resumes (3 Copies)</span>
                                <span className={`check-status ${vaultAudit?.hasResume ? "ready" : "pending"}`}>
                                    {vaultAudit?.hasResume ? "✅ Ready in Vault" : "⚠️ Needs Upload"}
                                </span>
                            </div>
                            <div className="vault-meter-row">
                                <span>10th Marksheet (DOB Proof)</span>
                                <span className={`check-status ${vaultAudit?.has10th ? "ready" : "pending"}`}>
                                    {vaultAudit?.has10th ? "✅ Ready in Vault" : "⚠️ Carry Original"}
                                </span>
                            </div>
                            <div className="vault-meter-row">
                                <span>College ID & Aadhaar</span>
                                <span className={`check-status ${vaultAudit?.hasCollegeId ? "ready" : "pending"}`}>
                                    {vaultAudit?.hasCollegeId ? "✅ Ready in Vault" : "⚠️ Carry Original"}
                                </span>
                            </div>
                            <div className="vault-meter-row">
                                <span>Consolidated Semester Marksheets</span>
                                <span className={`check-status ${vaultAudit?.hasDegreeMarksheets ? "ready" : "pending"}`}>
                                    {vaultAudit?.hasDegreeMarksheets ? "✅ Ready in Vault" : "⚠️ Sem 1-6 Pending"}
                                </span>
                            </div>
                        </div>
                        {setActivePage && (
                            <button
                                className="btn-manage-vault"
                                onClick={() => setActivePage("Documents")}
                            >
                                📁 Open Document Vault
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* User-Provided Email & Automated Dispatch Preferences Card */}
            <div className="email-preferences-card">
                <div className="email-card-header">
                    <div className="email-title-group">
                        <span className="email-header-icon">📬</span>
                        <div>
                            <div className="email-title-row">
                                <h3>Automated Placement Email Dispatcher & User Consent</h3>
                                <span className={`status-badge-consent ${isOptedIn ? "active" : "inactive"}`}>
                                    {isOptedIn ? "🟢 AUTO-DISPATCH ACTIVE" : "⚪ PAUSED"}
                                </span>
                            </div>
                            <p className="email-sub">
                                The email is provided by you. Our background daemon monitors 24/7 and automatically delivers rich placement briefings directly to your inbox whenever a matching company opens hiring.
                            </p>
                        </div>
                    </div>

                    {/* Quick Access to Simulated Placement Mailbox */}
                    <button
                        className="btn-open-mailbox-drawer"
                        onClick={() => setIsMailboxOpen(true)}
                        title="Open interactive Placement Mailbox Simulator"
                    >
                        <span>📬</span>
                        <span>Open Placement Mailbox</span>
                        {unreadCount > 0 && (
                            <span className="mailbox-unread-bubble">{unreadCount} New</span>
                        )}
                    </button>
                </div>

                <form className="email-permission-form" onSubmit={handleSavePreferences}>
                    <div className="email-inputs-row">
                        <div className="input-group-email">
                            <label className="email-input-label">
                                ✉️ Your Destination Email Address:
                            </label>
                            <input
                                type="email"
                                className="input-destination-email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="student@example.com"
                                required
                            />
                        </div>

                        <div className="input-group-consent-toggle">
                            <label className="checkbox-consent-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-consent"
                                    checked={optInConsent}
                                    onChange={(e) => setOptInConsent(e.target.checked)}
                                />
                                <span>
                                    I grant permission to PlaceMate AI to automatically dispatch placement briefings, 1-night prep kits, and midnight deadline alerts to this email.
                                </span>
                            </label>
                        </div>

                        <div className="email-actions-group">
                            <button
                                type="submit"
                                className="btn-save-email-prefs"
                                disabled={savingPrefs}
                            >
                                {savingPrefs ? "Saving..." : "Save Preferences"}
                            </button>

                            <button
                                type="button"
                                className="btn-trigger-daemon-scan"
                                onClick={handleTriggerEmailScan}
                                disabled={runningBgScan}
                                title="Run the background email daemon scan right now to simulate automated delivery"
                            >
                                {runningBgScan ? "Scanning Daemon..." : "⚡ Run Daemon Scan"}
                            </button>
                        </div>
                    </div>

                    {prefSaveMsg && (
                        <div className="consent-feedback-toast">
                            <span>{prefSaveMsg}</span>
                        </div>
                    )}

                    {bgScanReport && (
                        <div className="bg-scan-report-banner">
                            <strong>[Background Email Daemon Report]:</strong>
                            <span>
                                {bgScanReport.status === "idle"
                                    ? bgScanReport.message
                                    : `Scanned ${bgScanReport.totalOptedUsers || 1} opted-in student(s). Dispatched ${bgScanReport.dispatchedCount} automated placement email(s) to mailbox.`}
                            </span>
                        </div>
                    )}
                </form>
            </div>

            {/* Top KPI Metrics Grid */}
            <div className="alerts-kpi-grid">
                <div
                    className={`kpi-card critical ${selectedTab === "critical" ? "active-kpi" : ""}`}
                    onClick={() => setSelectedTab("critical")}
                >
                    <div className="kpi-icon-wrap">🚨</div>
                    <div className="kpi-info">
                        <span className="kpi-num">{stats.critical24hCount || 4}</span>
                        <span className="kpi-label">Closing in &lt; 24h</span>
                        <span className="kpi-desc">Zoho, TCS, Roots, Cognizant</span>
                    </div>
                    <span className="kpi-beacon">Live Countdown</span>
                </div>

                <div
                    className={`kpi-card flash ${selectedTab === "core" ? "active-kpi" : ""}`}
                    onClick={() => setSelectedTab("core")}
                >
                    <div className="kpi-icon-wrap">🏭</div>
                    <div className="kpi-info">
                        <span className="kpi-num">1</span>
                        <span className="kpi-label">Core Engineering Walk-in</span>
                        <span className="kpi-desc">Roots Codissia &bull; Spot Offer</span>
                    </div>
                    <span className="kpi-beacon high">No Exam Fee</span>
                </div>

                <div
                    className={`kpi-card flash ${selectedTab === "startup" ? "active-kpi" : ""}`}
                    onClick={() => setSelectedTab("startup")}
                >
                    <div className="kpi-icon-wrap">🚀</div>
                    <div className="kpi-info">
                        <span className="kpi-num">1</span>
                        <span className="kpi-label">Startup Internships</span>
                        <span className="kpi-desc">₹25,000/mo &bull; Zero CGPA Cutoff</span>
                    </div>
                    <span className="kpi-beacon high">GitHub Driven</span>
                </div>

                <div
                    className={`kpi-card govt ${selectedTab === "govt" ? "active-kpi" : ""}`}
                    onClick={() => setSelectedTab("govt")}
                >
                    <div className="kpi-icon-wrap">🏛️</div>
                    <div className="kpi-info">
                        <span className="kpi-num">{stats.govtUpdatesCount || 2}</span>
                        <span className="kpi-label">Govt & PSU Deadlines</span>
                        <span className="kpi-desc">TNPSC Group 4 & ISRO Scientist</span>
                    </div>
                    <span className="kpi-beacon govt">Exam Center Out</span>
                </div>
            </div>

            {/* Multi-Stream Filter Tabs Bar */}
            <div className="alerts-filter-bar">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${selectedTab === "all" ? "active" : ""}`}
                        onClick={() => setSelectedTab("all")}
                    >
                        🔥 All Radar ({alerts.length})
                    </button>
                    <button
                        className={`filter-tab ${selectedTab === "critical" ? "active" : ""}`}
                        onClick={() => setSelectedTab("critical")}
                    >
                        🚨 Closing &lt; 24h ({stats.critical24hCount || 0})
                    </button>
                    <button
                        className={`filter-tab ${selectedTab === "tech" ? "active" : ""}`}
                        onClick={() => setSelectedTab("tech")}
                    >
                        🏢 IT MNCs (4)
                    </button>
                    <button
                        className={`filter-tab ${selectedTab === "core" ? "active" : ""}`}
                        onClick={() => setSelectedTab("core")}
                    >
                        🏭 Core Walk-ins (1)
                    </button>
                    <button
                        className={`filter-tab ${selectedTab === "startup" ? "active" : ""}`}
                        onClick={() => setSelectedTab("startup")}
                    >
                        🚀 Startup Internships (1)
                    </button>
                    <button
                        className={`filter-tab ${selectedTab === "govt" ? "active" : ""}`}
                        onClick={() => setSelectedTab("govt")}
                    >
                        🏛️ Govt & PSUs ({stats.govtUpdatesCount || 0})
                    </button>
                </div>

                <div className="filter-summary">
                    <span>Showing <strong>{filteredAlerts.length}</strong> verified opportunities</span>
                </div>
            </div>

            {/* Alert Cards Feed */}
            <div className="alerts-list">
                {filteredAlerts.map((alert) => {
                    const isExpanded = !!expandedPrepKit[alert.id];
                    const eligibility = alert.eligibility || {};
                    const prep = alert.night_before_prep || {};
                    const docBag = alert.docBagStatus || { readyCount: 4, totalReq: 5, percent: 80, items: [] };

                    return (
                        <div
                            key={alert.id}
                            className={`career-alert-card ${alert.urgency === "critical_24h" ? "border-critical" : ""}`}
                        >
                            {/* Card Header */}
                            <div className="alert-card-header">
                                <div className="header-left">
                                    <div className="company-meta">
                                        <div className="company-logo-avatar">
                                            {alert.company.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="company-title-row">
                                                <h3 className="company-name">{alert.company}</h3>
                                                {alert.source && (
                                                    <span className="badge-live-stream-source" title={`Verified live opening from ${alert.source}`}>
                                                        🌐 {alert.source}
                                                    </span>
                                                )}
                                                {alert.posted_at && (
                                                    <span className="badge-live-posted-time">
                                                        🕒 {new Date(alert.posted_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                                    </span>
                                                )}
                                                {alert.urgency === "critical_24h" && (
                                                    <span className="badge-critical-pulse">
                                                        🚨 CLOSING IN &lt; 24H
                                                    </span>
                                                )}
                                                {alert.category === "core_walkin" && (
                                                    <span className="badge-core">🏭 CORE WALK-IN</span>
                                                )}
                                                {alert.category === "startup_internship" && (
                                                    <span className="badge-startup">🚀 STARTUP INTERNSHIP</span>
                                                )}
                                                {alert.category === "government_exam" && (
                                                    <span className="badge-govt">🏛️ GOVT EXAM</span>
                                                )}
                                                {alert.alert_type === "flash_drive" && alert.category === "job" && (
                                                    <span className="badge-flash">⚡ FLASH DRIVE</span>
                                                )}
                                            </div>
                                            <h4 className="role-title">{alert.title}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="header-right">
                                    {/* Live Countdown Clock */}
                                    <div className="countdown-box">
                                        <span className="countdown-label">Form Closes In:</span>
                                        <span className="countdown-time">
                                            ⏳ {formatRemainingTime(alert.deadline_hours_from_now)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Quick Badges Bar */}
                            <div className="alert-tags-row">
                                <div className="tag-item ctc">
                                    <span className="tag-icon">💰</span>
                                    <span><strong>CTC / Stipend:</strong> {alert.ctc_or_stipend}</span>
                                </div>
                                <div className="tag-item loc">
                                    <span className="tag-icon">📍</span>
                                    <span><strong>Location:</strong> {alert.location}</span>
                                </div>
                                <div className="tag-item batch">
                                    <span className="tag-icon">🎓</span>
                                    <span><strong>Batches:</strong> {alert.batch_allowed}</span>
                                </div>
                            </div>

                            {/* Eligibility Shield Strip */}
                            <div className="eligibility-shield-strip">
                                <div className="shield-verdict">
                                    <span className="shield-icon">🛡️</span>
                                    <div>
                                        <strong>Eligibility Shield:</strong>
                                        <span className="shield-badge-green">
                                            {eligibility.verdictBadge || "🟢 100% Safe to Sit"}
                                        </span>
                                    </div>
                                </div>
                                <div className="shield-details">
                                    <span><strong>Cutoff:</strong> Min {alert.min_cgpa} CGPA (You: {candidate.cgpa || 8.14})</span>
                                    <span className="separator">&bull;</span>
                                    <span><strong>Arrear Policy:</strong> {alert.arrear_policy}</span>
                                </div>
                            </div>

                            {/* Document Bag Status Preview */}
                            <div className="doc-bag-preview-strip">
                                <div className="doc-bag-title">
                                    <span>🎒 <strong>Interview Day Document Bag:</strong></span>
                                    <span className="doc-bag-count">
                                        {docBag.readyCount} / {docBag.totalReq} Documents Verified
                                    </span>
                                </div>
                                <div className="doc-bag-pills">
                                    {(docBag.items || []).map((doc, dIdx) => (
                                        <span
                                            key={dIdx}
                                            className={`doc-pill ${doc.isReadyInVault ? "verified" : "pending"}`}
                                            title={doc.isReadyInVault ? "Available in your Document Vault" : "Upload this file before drive day"}
                                        >
                                            {doc.isReadyInVault ? "✅" : "⚠️"} {doc.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Automated Background Dispatch Status Indicator */}
                            <div className="automated-dispatch-indicator-row">
                                <div className="indicator-left">
                                    <span className="indicator-bullet">
                                        {isOptedIn ? "🟢" : "⚪"}
                                    </span>
                                    <span className="indicator-text">
                                        {isOptedIn ? (
                                            <>
                                                <strong>Background Email Dispatch Active:</strong> Our daemon automatically dispatches rich placement briefings directly to <strong>{activeEmailDisplay}</strong>.
                                            </>
                                        ) : (
                                            <>
                                                <strong>Automated Email Alerts Paused:</strong> Check the permission box above to receive placement briefings automatically.
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons Bar */}
                            <div className="alert-card-actions">
                                <div className="action-group-left">
                                    <button
                                        className={`btn-prep-toggle ${isExpanded ? "active" : ""}`}
                                        onClick={() => togglePrepKit(alert.id)}
                                    >
                                        <span>📖</span>
                                        <span>{isExpanded ? "Hide 1-Night Prep Kit" : "Emergency 1-Night Prep Kit"}</span>
                                        <span className="toggle-chevron">{isExpanded ? "▲" : "▼"}</span>
                                    </button>

                                    {onStartMockTest && (
                                        <button
                                            className="btn-launch-mock"
                                            onClick={() => onStartMockTest(alert.company, alert.title)}
                                            title="Launch simulated timed test with company-specific questions"
                                        >
                                            <span>📝</span>
                                            <span>Practice Mock Test</span>
                                        </button>
                                    )}

                                    {onStartInterview && alert.category === "job" && (
                                        <button
                                            className="btn-launch-voice"
                                            onClick={() => onStartInterview(alert.company, alert.title)}
                                            title="Practice AI Voice Technical Interview for this role"
                                        >
                                            <span>🎙️</span>
                                            <span>Voice Interview</span>
                                        </button>
                                    )}
                                </div>

                                <div className="action-group-right">
                                    {/* Direct Apply Official Link */}
                                    <a
                                        href={alert.apply_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-apply-direct"
                                    >
                                        <span>Apply on Portal</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                            </div>

                            {/* Expandable 1-Night Prep Kit Drawer */}
                            {isExpanded && (
                                <div className="prep-kit-drawer">
                                    <div className="prep-drawer-header">
                                        <div className="drawer-title-row">
                                            <span className="prep-icon">⚡</span>
                                            <div>
                                                <h4>Emergency 1-Night Prep Kit &bull; {alert.company}</h4>
                                                <p className="drawer-desc">
                                                    Curated placement cell intelligence on Round 1 elimination patterns and repeated question types.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prep-drawer-grid">
                                        {/* Round 1 Blueprint */}
                                        <div className="prep-box blueprint">
                                            <div className="box-title">
                                                <span>🎯</span>
                                                <strong>Round 1 Elimination Blueprint</strong>
                                            </div>
                                            <p className="box-body">{prep.round1Focus}</p>
                                            {prep.cheatSheetTips && (
                                                <div className="secret-tip-callout">
                                                    <span className="tip-star">💡</span>
                                                    <div>
                                                        <strong>Placement Cell Intel:</strong>
                                                        <p>{prep.cheatSheetTips}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Repeated Questions */}
                                        <div className="prep-box repeated-qs">
                                            <div className="box-title">
                                                <span>❓</span>
                                                <strong>Top Repeated Questions & Patterns</strong>
                                            </div>
                                            <ul className="repeat-list">
                                                {(prep.repeatQuestions || []).map((q, qIdx) => (
                                                    <li key={qIdx}>
                                                        <span className="q-bullet">&bull;</span>
                                                        <span>{q}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="prep-fast-actions">
                                                {onStartMockTest && (
                                                    <button
                                                        className="btn-sim-now"
                                                        onClick={() => onStartMockTest(alert.company, alert.title)}
                                                    >
                                                        ⚡ Test Yourself in {alert.company} Simulator
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Interactive Placement Mailbox Simulator Modal */}
            {isMailboxOpen && (
                <div className="modal-overlay" onClick={() => setIsMailboxOpen(false)}>
                    <div className="mailbox-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="mailbox-modal-header">
                            <div className="mailbox-brand">
                                <span className="mailbox-header-icon">📬</span>
                                <div>
                                    <h3>Automated Placement Mailbox Simulator</h3>
                                    <span>Emails automatically dispatched to <strong>{activeEmailDisplay}</strong></span>
                                </div>
                            </div>
                            <button
                                className="btn-close-modal"
                                onClick={() => setIsMailboxOpen(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mailbox-split-view">
                            {/* Left Pane: Email List */}
                            <div className="mailbox-list-pane">
                                <div className="list-pane-header">
                                    <strong>Inbox ({mailbox.length})</strong>
                                    <button
                                        className="btn-refresh-mail"
                                        onClick={loadMailbox}
                                        title="Check for new messages"
                                    >
                                        🔄 Refresh
                                    </button>
                                </div>

                                {mailbox.length === 0 ? (
                                    <div className="mailbox-empty-state">
                                        <p>No placement emails delivered yet.</p>
                                        <small>Click <strong>"⚡ Run Daemon Scan"</strong> above to simulate background delivery!</small>
                                    </div>
                                ) : (
                                    <div className="mail-items-scroll">
                                        {mailbox.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`mail-list-item ${selectedEmail?.id === item.id ? "selected" : ""} ${!item.is_read ? "unread" : ""}`}
                                                onClick={() => handleSelectEmail(item)}
                                            >
                                                <div className="mail-item-top">
                                                    <span className="mail-sender">{item.company}</span>
                                                    <span className="mail-time">
                                                        {new Date(item.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="mail-subject">{item.subject}</div>
                                                <div className="mail-snippet">
                                                    Package &bull; 100% Eligible &bull; Round 1 Blueprint enclosed
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Pane: Email Viewer */}
                            <div className="mailbox-reader-pane">
                                {selectedEmail ? (
                                    <div className="mail-reader-content">
                                        <div className="reader-header">
                                            <div className="reader-subject">{selectedEmail.subject}</div>
                                            <div className="reader-meta">
                                                <div>
                                                    <strong>From:</strong> PlaceMate Placement Radar &lt;radar@placemate.ai&gt;
                                                </div>
                                                <div>
                                                    <strong>To:</strong> {selectedEmail.recipient_email}
                                                </div>
                                                <div>
                                                    <strong>Received:</strong> {new Date(selectedEmail.dispatched_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="reader-html-body"
                                            dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                                        />
                                    </div>
                                ) : (
                                    <div className="reader-placeholder">
                                        <span>👈 Select an email from the left pane to read.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mailbox-modal-footer">
                            <span className="footer-status-text">
                                💡 Tip: In real production, these exact HTML emails are pushed through SMTP to the student's actual Gmail address.
                            </span>
                            <button
                                className="btn-close-mailbox"
                                onClick={() => setIsMailboxOpen(false)}
                            >
                                Close Mailbox
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CareerAlerts;
