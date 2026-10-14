import { useState, useEffect } from "react";

import { API } from "../config";

function GovernmentExams({ setActivePage }) {
    // ==================================================
    // TOP NAVIGATION TABS: circulars, syllabus, radar, simulator
    // ==================================================
    const [activeTab, setActiveTab] = useState("circulars"); // 'circulars' | 'syllabus' | 'radar' | 'simulator'

    // ==================================================
    // 1. LIVE CIRCULARS NOTIFICATION TRACKER STATE
    // ==================================================
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [emailModalExam, setEmailModalExam] = useState(null);
    const [alertEmailInput, setAlertEmailInput] = useState("");
    const [emailSending, setEmailSending] = useState(false);
    const [emailSentSuccess, setEmailSentSuccess] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    const examTypes = [
        { id: "all", label: "All Indian Exams 🏛️" },
        { id: "central_govt", label: "Central Administration (UPSC / SSC / Supreme Court) 🇮🇳" },
        { id: "banking_finance", label: "Banking & Insurance (IBPS / SBI / RBI) 🏦" },
        { id: "psu", label: "PSUs & Scientific (ISRO / BEL / DRDO) 🚀" },
        { id: "state_govt", label: "State Boards & PSCs (State PSCs / High Courts) ⚡" },
        { id: "defense", label: "Defense & Paramilitary (CDS / AFCAT / Police) 🎖️" }
    ];

    // ==================================================
    // 2. ACTUAL GOVT EXAM SIMULATOR STATE
    // ==================================================
    const [simExamKey, setSimExamKey] = useState("ssc_cgl");
    const [mockTestData, setMockTestData] = useState(null);
    const [mockLoading, setMockLoading] = useState(false);
    const [researchingExamTitle, setResearchingExamTitle] = useState("");
    const [researchStage, setResearchStage] = useState(1);
    const [activeSectionFilter, setActiveSectionFilter] = useState("all");
    const [customSearchExam, setCustomSearchExam] = useState("");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { [qId]: selectedOptionIndex }
    const [markedReview, setMarkedReview] = useState({}); // { [qId]: true }
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(1200);
    const [isTestActive, setIsTestActive] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [scorecard, setScorecard] = useState(null);
    const [practiceModalExam, setPracticeModalExam] = useState(null); // Controls pre-exam mode selector modal
    const [selectedExamMode, setSelectedExamMode] = useState("speed_drill"); // 'speed_drill' (20 Qs) or 'full_paper' (100 Qs)

    // ==================================================
    // 3. MULTI-DOCUMENT GOVT EXAM MATCHER & DV READINESS STATE
    // ==================================================
    const [isVaultMatchActive, setIsVaultMatchActive] = useState(false);
    const [matchingLoading, setMatchingLoading] = useState(false);
    const [matchedExamsData, setMatchedExamsData] = useState([]);
    const [candidateData, setCandidateData] = useState(null);
    const [vaultData, setVaultData] = useState(null);
    const [matchedStats, setMatchedStats] = useState(null);
    const [dvFilter, setDvFilter] = useState("all"); // 'all' | 'dv_ready' | 'docs_pending' | 'ineligible'
    const [selectedDVAuditExam, setSelectedDVAuditExam] = useState(null);
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        dob: "2004-06-15",
        category: "General",
        domicileState: "All India",
        specialQualifications: {
            typing: false,
            steno: false,
            drivingLicense: false,
            computerCert: false
        }
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // ==================================================
    // FETCH LIVE EXAM CIRCULARS
    // ==================================================
    useEffect(() => {
        if (activeTab === "circulars") {
            fetchExams(searchQuery, selectedType);
        }
    }, [selectedType, activeTab]);

    const fetchExams = async (customQuery, customType) => {
        setLoading(true);
        setError(null);
        try {
            const orgType = customType !== undefined ? customType : selectedType;
            let url = `${API}/opportunities?category=government_exam`;
            if (orgType === "central_govt" || orgType === "psu" || orgType === "state_govt") {
                url += `&organization_type=${orgType}`;
            }

            const q = customQuery !== undefined ? customQuery.trim() : searchQuery.trim();
            if (q) {
                url += `&search=${encodeURIComponent(q)}`;
            }

            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load government exam notifications");

            const data = await res.json();
            let results = data.opportunities || [];

            if (orgType === "banking_finance") {
                results = results.filter(e => 
                    e.domain === "banking_finance" || 
                    e.organization?.toLowerCase().includes("bank") ||
                    e.organization?.toLowerCase().includes("insurance") ||
                    e.organization?.toLowerCase().includes("ibps") ||
                    e.organization?.toLowerCase().includes("nicl") ||
                    e.organization?.toLowerCase().includes("lic") ||
                    e.organization?.toLowerCase().includes("rbi")
                );
            } else if (orgType === "defense") {
                results = results.filter(e => 
                    e.domain === "defense_paramilitary" || 
                    e.organization?.toLowerCase().includes("guard") ||
                    e.organization?.toLowerCase().includes("police") ||
                    e.organization?.toLowerCase().includes("defence") ||
                    e.organization?.toLowerCase().includes("army") ||
                    e.organization?.toLowerCase().includes("air force")
                );
            }

            setExams(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        fetchExams(searchQuery, selectedType);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        fetchExams("", selectedType);
    };



    // ==================================================
    // EXAM SIMULATOR: LAUNCH DYNAMIC ON-DEMAND MOCK TEST
    // ==================================================
    const openPracticeModal = (examObjOrKey) => {
        const isObj = typeof examObjOrKey === "object" && examObjOrKey !== null;
        const targetExam = isObj ? examObjOrKey : { title: String(examObjOrKey), id: String(examObjOrKey) };
        setPracticeModalExam(targetExam);
        setSelectedExamMode("speed_drill"); // default to speed drill
    };

    const handleStartMockTest = async (examObjOrKey = simExamKey, modeToUse = selectedExamMode) => {
        setPracticeModalExam(null); // close selection modal if open
        setMockLoading(true);
        setUserAnswers({});
        setMarkedReview({});
        setCurrentQuestionIndex(0);
        setIsSubmitted(false);
        setScorecard(null);
        setActiveSectionFilter("all");
        setActiveTab("simulator");

        const isObj = typeof examObjOrKey === "object" && examObjOrKey !== null;
        const targetTitle = isObj ? (examObjOrKey.title || "Government Examination") : String(examObjOrKey);
        setResearchingExamTitle(targetTitle);
        setSimExamKey(isObj ? (examObjOrKey.id || targetTitle) : targetTitle);
        setResearchStage(1);

        // Animated stage sequence for research loader
        const stageTimer = setInterval(() => {
            setResearchStage(prev => (prev < 3 ? prev + 1 : prev));
        }, 800);

        try {
            let res;
            if (isObj) {
                res = await fetch(`${API}/api/govt-exams/dynamic-mock-test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        examId: examObjOrKey.id,
                        title: examObjOrKey.title,
                        organization: examObjOrKey.organization,
                        description: examObjOrKey.description,
                        domain: examObjOrKey.domain,
                        organization_type: examObjOrKey.organization_type,
                        location: examObjOrKey.location,
                        eligible_degrees: examObjOrKey.eligible_degrees,
                        exam_stages: examObjOrKey.exam_stages,
                        mode: modeToUse
                    })
                });
            } else {
                res = await fetch(`${API}/api/govt-exams/dynamic-mock-test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        examKey: examObjOrKey,
                        title: examObjOrKey,
                        mode: modeToUse
                    })
                });
            }

            if (!res.ok) throw new Error("Could not research or load authentic exam paper");
            const data = await res.json();
            setMockTestData(data);
            setTimeLeftSeconds((data.durationMinutes || (modeToUse === "full_paper" ? 90 : 25)) * 60);
            setIsTestActive(true);
        } catch (err) {
            console.error("Exam test generation error:", err);
            alert("Notice: " + err.message);
        } finally {
            clearInterval(stageTimer);
            setMockLoading(false);
            setResearchingExamTitle("");
        }
    };

    // Countdown Timer Effect
    useEffect(() => {
        if (!isTestActive || isSubmitted || timeLeftSeconds <= 0) return;

        const timer = setInterval(() => {
            setTimeLeftSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isTestActive, isSubmitted, timeLeftSeconds]);

    // Format mm:ss
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Submit and Evaluate Mock Test
    const handleSubmitTest = () => {
        if (!mockTestData || !mockTestData.questions) return;
        setIsSubmitted(true);
        setIsTestActive(false);

        const questions = mockTestData.questions;
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;
        const sectionBreakdown = {};

        // Scheme
        const posMark = parseFloat(String(mockTestData.markingScheme.correct).replace("+", "")) || 2;
        const negMark = parseFloat(String(mockTestData.markingScheme.incorrect).replace("-", "")) || 0.5;

        questions.forEach((q) => {
            const sec = q.section || "General";
            if (!sectionBreakdown[sec]) {
                sectionBreakdown[sec] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };
            }
            sectionBreakdown[sec].total++;

            const chosen = userAnswers[q.id];
            if (chosen === undefined) {
                skippedCount++;
                sectionBreakdown[sec].skipped++;
            } else if (chosen === q.correctIndex) {
                correctCount++;
                sectionBreakdown[sec].correct++;
            } else {
                incorrectCount++;
                sectionBreakdown[sec].incorrect++;
            }
        });

        const rawScore = (correctCount * posMark) - (incorrectCount * negMark);
        const maxScore = questions.length * posMark;
        const percentage = Math.round((Math.max(0, rawScore) / maxScore) * 100);

        // Projected cutoff benchmark
        let expectedCutoffPercent = mockTestData.expectedCutoffPercent || 68;
        let cutoffStatus;
        if (percentage >= expectedCutoffPercent) {
            cutoffStatus = `Comfortably Cleared Projected Cutoff (${expectedCutoffPercent}%)`;
        } else if (percentage >= expectedCutoffPercent - 8) {
            cutoffStatus = `Borderline Performance - Revision Advised (Target: ${expectedCutoffPercent}%)`;
        } else {
            cutoffStatus = `Below Cutoff Benchmark (${expectedCutoffPercent}%) - Deep Practice Needed`;
        }

        setScorecard({
            rawScore: Number(rawScore.toFixed(2)),
            maxScore,
            correctCount,
            incorrectCount,
            skippedCount,
            percentage,
            cutoffStatus,
            expectedCutoffPercent,
            sectionBreakdown
        });
    };

    // Calculate days remaining to deadline
    const getDaysRemaining = (deadlineStr) => {
        if (!deadlineStr) return null;
        const diffMs = new Date(deadlineStr).getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const fetchVaultMatches = async () => {
        setMatchingLoading(true);
        try {
            const res = await fetch(`${API}/api/govt-exams/document-matches`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to load document vault matches");
            const data = await res.json();
            setMatchedExamsData(data.matchedExams || []);
            setCandidateData(data.candidate || null);
            setVaultData(data.vault || null);
            setMatchedStats(data.stats || null);
            if (data.candidate) {
                setEditProfileData({
                    dob: data.candidate.dob ? data.candidate.dob.split("T")[0] : "2004-06-15",
                    category: data.candidate.category || "General",
                    domicileState: data.candidate.domicileState || "All India",
                    specialQualifications: {
                        typing: data.candidate.hasTyping || false,
                        steno: data.candidate.hasSteno || false,
                        drivingLicense: data.candidate.hasDrivingLicense || false,
                        computerCert: data.candidate.hasComputerCert || false
                    }
                });
            }
        } catch (err) {
            console.error("Error loading document matches:", err);
        } finally {
            setMatchingLoading(false);
        }
    };

    const toggleVaultMatching = () => {
        if (!isVaultMatchActive) {
            fetchVaultMatches();
            setIsVaultMatchActive(true);
        } else {
            setIsVaultMatchActive(false);
        }
    };

    const handleUpdateDVProfile = async (e) => {
        if (e) e.preventDefault();
        setUpdatingProfile(true);
        try {
            const res = await fetch(`${API}/api/govt-exams/update-dv-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editProfileData)
            });
            if (!res.ok) throw new Error("Failed to update candidate profile");
            const data = await res.json();
            setMatchedExamsData(data.matchedExams || []);
            setCandidateData(data.candidate || null);
            setVaultData(data.vault || null);
            setMatchedStats(data.stats || null);
            setShowProfileEditModal(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Error updating credentials: " + err.message);
        } finally {
            setUpdatingProfile(false);
        }
    };

    const sourceExamsList = isVaultMatchActive && matchedExamsData.length > 0 ? matchedExamsData : exams;

    const filteredExams = sourceExamsList.filter(e => {
        // Sector / Org Type filter when in vault matching mode
        if (isVaultMatchActive && selectedType !== "all") {
            if (selectedType === "central_govt" && e.organization_type !== "central_govt") return false;
            if (selectedType === "state_govt" && e.organization_type !== "state_govt") return false;
            if (selectedType === "psu" && e.organization_type !== "psu") return false;
            if (selectedType === "banking_finance") {
                const isBank = e.domain === "banking_finance" || 
                    e.organization?.toLowerCase().includes("bank") ||
                    e.organization?.toLowerCase().includes("insurance") ||
                    e.organization?.toLowerCase().includes("ibps") ||
                    e.organization?.toLowerCase().includes("rbi") ||
                    e.organization?.toLowerCase().includes("lic");
                if (!isBank) return false;
            }
            if (selectedType === "defense") {
                const isDef = e.domain === "defense_paramilitary" || 
                    e.organization?.toLowerCase().includes("police") ||
                    e.organization?.toLowerCase().includes("guard") ||
                    e.organization?.toLowerCase().includes("defence") ||
                    e.organization?.toLowerCase().includes("army");
                if (!isDef) return false;
            }
        }

        // DV Status filter
        if (isVaultMatchActive && dvFilter !== "all") {
            if (e.dvAudit?.dvStatus !== dvFilter) return false;
        }

        // Search Query filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const inDegrees = Array.isArray(e.eligible_degrees) && 
            e.eligible_degrees.some(d => d.toLowerCase().includes(q));
        return (
            e.title?.toLowerCase().includes(q) ||
            e.organization?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            inDegrees
        );
    });

    const handleSendEmailAlert = async () => {
        if (!emailModalExam) return;
        setEmailSending(true);
        try {
            const targetEmail = alertEmailInput.trim() || candidateData?.email || "student.demo@docmind.ai";
            const res = await fetch(`${API}/api/alerts/send-circular-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientEmail: targetEmail,
                    examId: emailModalExam.id,
                    title: emailModalExam.title,
                    organization: emailModalExam.organization,
                    deadline: emailModalExam.deadline,
                    salary_or_stipend: emailModalExam.salary_or_stipend,
                    apply_url: emailModalExam.apply_url,
                    description: emailModalExam.description
                }),
                credentials: "include"
            });
            const data = await res.json();
            setEmailSentSuccess(true);
            setTimeout(() => {
                setEmailSentSuccess(false);
                setEmailModalExam(null);
            }, 2200);
        } catch (err) {
            alert("Could not dispatch circular briefing: " + err.message);
        } finally {
            setEmailSending(false);
        }
    };

    const handleSyncLive = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const res = await fetch(`${API}/opportunities/sync-live`, {
                method: "POST",
                credentials: "include"
            });
            const data = await res.json();
            setSyncMessage(data.message || "Government circulars synced live from official notification feeds!");
            await fetchExams();
            setTimeout(() => setSyncMessage(null), 4000);
        } catch (err) {
            alert("Live fetch error: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="govt-exams-page">
            {/* Main Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-badge badge-gold">
                        <span>🏛️</span>
                        <span>Government Recruitment & Preparation Hub</span>
                    </div>
                    <h1 className="page-title">Indian Government Exams Intelligence</h1>
                    <p className="page-subtitle">
                        Real-time official government circular tracking, statutory document verification audits, and authentic AI-powered timed PYQ exam simulators.
                    </p>
                </div>

                <div className="header-actions-group">
                    <button 
                        className={`btn btn-vault-matcher-toggle ${isVaultMatchActive ? "active" : ""}`}
                        onClick={toggleVaultMatching}
                        disabled={matchingLoading}
                        title="Audit all 500+ circulars against your Document Vault proofs"
                    >
                        <span className="btn-icon">⚡</span>
                        <span>{matchingLoading ? "Auditing Vault..." : isVaultMatchActive ? "Vault Matcher Active" : "Match with My Vault Documents"}</span>
                        {isVaultMatchActive && matchedStats && (
                            <span className="vault-match-pill">{matchedStats.dvReadyCount + matchedStats.docsPendingCount} Eligible</span>
                        )}
                    </button>

                    <button 
                        className={`btn btn-sync-live ${isSyncing ? "btn-syncing" : ""}`}
                        onClick={handleSyncLive}
                        disabled={isSyncing}
                        title="Scan government feeds for latest recruitment notifications"
                    >
                        <span className={`sync-icon ${isSyncing ? "spinning" : ""}`}>🔄</span>
                        <span>{isSyncing ? "Scanning Govt Feeds..." : "Fetch Live Circulars"}</span>
                    </button>
                </div>
            </div>

            {/* Sync Notification Banner */}
            {syncMessage && (
                <div className="sync-notification-toast">
                    <span>⚡</span>
                    <span>{syncMessage}</span>
                </div>
            )}

            {/* TOP SUB-NAVIGATION TABS */}
            <div className="govt-nav-tabs-bar">
                <button
                    className={`govt-nav-tab-btn ${activeTab === "circulars" ? "active" : ""}`}
                    onClick={() => setActiveTab("circulars")}
                >
                    <span className="tab-icon">🏛️</span>
                    <span>Notification Circulars ({exams.length > 0 ? exams.length : "500+"})</span>
                </button>

                <button
                    className={`govt-nav-tab-btn ${activeTab === "simulator" ? "active" : ""}`}
                    onClick={() => setActiveTab("simulator")}
                >
                    <span className="tab-icon">🎯</span>
                    <span>Exam Prep Simulator & Mock Tests</span>
                    <span className="pulse-dot"></span>
                </button>
            </div>

            {/* ==================================================
                TAB 1: OFFICIAL NOTIFICATION RADAR (CIRCULARS)
               ================================================== */}
            {activeTab === "circulars" && (
                <div className="tab-view-content">
                    {/* Compact DV Matcher Status Bar (Uncluttered) */}
                    {isVaultMatchActive && matchedStats && (
                        <div className="vault-dv-filter-tabs-compact" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                            <button 
                                type="button"
                                className={`dv-filter-btn ${dvFilter === "all" ? "active" : ""}`}
                                onClick={() => setDvFilter("all")}
                            >
                                <span>All Circulars ({matchedStats.totalExams})</span>
                            </button>
                            <button 
                                type="button"
                                className={`dv-filter-btn filter-ready ${dvFilter === "dv_ready" ? "active" : ""}`}
                                onClick={() => setDvFilter("dv_ready")}
                            >
                                <span>🟢 100% DV Ready ({matchedStats.dvReadyCount})</span>
                            </button>
                            <button 
                                type="button"
                                className={`dv-filter-btn filter-pending ${dvFilter === "docs_pending" ? "active" : ""}`}
                                onClick={() => setDvFilter("docs_pending")}
                            >
                                <span>🟡 Eligible - Docs Pending ({matchedStats.docsPendingCount})</span>
                            </button>
                            <button 
                                type="button"
                                className={`dv-filter-btn filter-ineligible ${dvFilter === "ineligible" ? "active" : ""}`}
                                onClick={() => setDvFilter("ineligible")}
                            >
                                <span>🔴 Ineligible ({matchedStats.ineligibleCount})</span>
                            </button>
                        </div>
                    )}

                    {/* Controls & Filters */}
                    <div className="jobs-controls-card">
                        <div className="jobs-search-row">
                            <form className="govt-search-form" onSubmit={handleSearchSubmit}>
                                <div className="search-input-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by exam name, department, location (e.g. SSC CGL, RRB NTPC, SBI PO, ISRO, UPSC)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                    {searchQuery && (
                                        <button 
                                            type="button" 
                                            className="clear-btn" 
                                            onClick={handleClearSearch}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <button type="submit" className="btn-search-circulars">
                                    <span>🔍 Search</span>
                                </button>
                            </form>
                        </div>

                        <div className="category-pill-group">
                            {examTypes.map((t) => (
                                <button
                                    key={t.id}
                                    className={`filter-pill ${selectedType === t.id ? "active" : ""}`}
                                    onClick={() => setSelectedType(t.id)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notification Cards List */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Querying verified Indian government notification circulars...</p>
                        </div>
                    ) : error ? (
                        <div className="error-card">
                            <p>⚠️ {error}</p>
                            <button className="btn btn-secondary" onClick={() => fetchExams(searchQuery, selectedType)}>Retry</button>
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🏛️</div>
                            <h3>
                                {searchQuery.trim()
                                    ? `No circulars found matching "${searchQuery}"`
                                    : "No notifications found for this sector"}
                            </h3>
                            <p>
                                {searchQuery.trim()
                                    ? "Try another keyword (e.g., 'SSC', 'Railway', 'Police', 'Banking') or click below to view all."
                                    : 'Try switching to "All Indian Exams" to see active circulars.'}
                            </p>
                            {searchQuery.trim() && (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ marginTop: "14px", padding: "8px 18px", fontWeight: "600" }} 
                                    onClick={handleClearSearch}
                                >
                                    🔄 Clear Search & View All
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="govt-grid">
                            {filteredExams.map((exam) => {
                                const daysLeft = getDaysRemaining(exam.deadline);
                                const isUrgent = daysLeft !== null && daysLeft <= 7;

                                return (
                                    <div 
                                        key={exam.id} 
                                        className={`govt-card ${isUrgent ? "urgent-exam-card" : ""} ${isVaultMatchActive && exam.dvAudit ? "dv-card-" + exam.dvAudit.dvStatus : ""}`}
                                    >
                                        {/* Top Banner: Urgency Countdown & DV Badge */}
                                        <div className="govt-card-topbar">
                                            <span className="govt-org-badge">
                                                {exam.domain === "defense_paramilitary" ? "🎖️ Defense / Paramilitary" :
                                                 exam.domain === "banking_finance" ? "🏦 Banking & Financial" :
                                                 exam.domain === "judiciary_law" ? "⚖️ Judiciary & Courts" :
                                                 exam.organization_type === "central_govt" ? "🇮🇳 Central Govt" :
                                                 exam.organization_type === "psu" ? "🚀 PSU / Scientific" :
                                                 exam.organization_type === "state_govt" ? "⚡ State Department" : "🏛️ Public Sector"}
                                            </span>

                                            {daysLeft !== null && (
                                                <div className={`countdown-badge ${isUrgent ? "countdown-urgent" : "countdown-normal"}`}>
                                                    <span className="clock-icon">⏳</span>
                                                    <strong>{daysLeft > 0 ? `${daysLeft} Days Left` : "Closing Today!"}</strong>
                                                </div>
                                            )}
                                        </div>

                                        <div className="govt-card-body">
                                            {/* Dedicated Multi-Document DV Scrutiny Strip */}
                                            {isVaultMatchActive && exam.dvAudit && (
                                                <div className={`govt-dv-audit-strip dv-strip-${exam.dvAudit.dvStatus}`}>
                                                    <div className="dv-audit-left">
                                                        <div className={`dv-score-circle dv-circle-${exam.dvAudit.dvStatus}`}>
                                                            <span className="dv-score-val">{exam.dvAudit.matchScore}%</span>
                                                            <span className="dv-score-lbl">DV Score</span>
                                                        </div>
                                                        <div className="dv-audit-meta">
                                                            <div className="dv-status-row">
                                                                <strong className={`dv-status-title status-${exam.dvAudit.dvStatus}`}>
                                                                    {exam.dvAudit.dvBadgeLabel}
                                                                </strong>
                                                                {exam.dvAudit.relaxationApplied && (
                                                                    <span className="dv-relax-pill">⚡ {exam.dvAudit.relaxationApplied}</span>
                                                                )}
                                                            </div>
                                                            <div className="dv-proof-stats">
                                                                <span>✓ Age: {candidateData?.age || 22}y [{exam.dvAudit.effectiveAgeBracket}]</span>
                                                                <span className="dot-sep">•</span>
                                                                <span>📋 Vault: {exam.dvAudit.verifiedDocsCount}/{exam.dvAudit.totalRequiredDocs} Proofs</span>
                                                                <span className="dot-sep">•</span>
                                                                <span>📍 {exam.dvAudit.domicileStatus.includes("100% Home State") ? "State Quota Active" : "Open Quota"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        className="btn-view-audit-modal"
                                                        onClick={() => setSelectedDVAuditExam(exam)}
                                                        title="Inspect official Document Verification checklist & proofs"
                                                    >
                                                        <span>📋 Audit Checklist ↗</span>
                                                    </button>
                                                </div>
                                            )}

                                            <h4 className="govt-org-name">{exam.organization}</h4>
                                            <h3 className="govt-exam-title">{exam.title}</h3>

                                            {/* Meta pills */}
                                            <div className="govt-meta-chips">
                                                <span className="meta-chip">
                                                    🎓 Qualification: {Array.isArray(exam.eligible_degrees) ? exam.eligible_degrees.join(", ") : "Any Graduate"}
                                                </span>
                                                <span className="meta-chip highlight-chip">
                                                    💰 Pay Scale: {exam.salary_or_stipend}
                                                </span>
                                                <span className="meta-chip">
                                                    📍 Centers: {exam.location}
                                                </span>
                                            </div>

                                            {/* Exam Stages Breakdown */}
                                            {Array.isArray(exam.exam_stages) && exam.exam_stages.length > 0 && (
                                                <div className="exam-stages-box">
                                                    <span className="stages-title">📋 Selection Stages & Syllabus:</span>
                                                    <ol className="stages-list">
                                                        {exam.exam_stages.map((stage, sIdx) => (
                                                            <li key={sIdx}>{stage}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}

                                            <p className="govt-description">
                                                {exam.description}
                                            </p>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="govt-card-footer">
                                            <div className="deadline-date-info">
                                                <span>📅 Closing Date:</span>
                                                <strong>
                                                    {exam.deadline ? new Date(exam.deadline).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    }) : "Refer Circular"}
                                                </strong>
                                            </div>

                                            <div className="action-buttons">
                                                <button
                                                    className="btn-email-alert"
                                                    title="Receive official circular briefing on email"
                                                    onClick={() => {
                                                        setEmailModalExam(exam);
                                                        setAlertEmailInput(candidateData?.email || "");
                                                    }}
                                                >
                                                    <span>✉️ Email Alert</span>
                                                </button>

                                                <button
                                                    className="btn-prepare-action"
                                                    title={`Choose Speed Drill (20 Qs) or Full Simulation (100 Qs) for ${exam.title}`}
                                                    onClick={() => openPracticeModal(exam)}
                                                >
                                                    <span>🎯 Practice PYQs</span>
                                                </button>

                                                <a
                                                    href={exam.apply_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary btn-portal-action"
                                                >
                                                    <span>Portal ↗</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}



            {/* ==================================================
                TAB 2: ACTUAL GOVERNMENT EXAM SIMULATOR (ARENA)
               ================================================== */}
            {activeTab === "simulator" && (
                <div className="tab-view-content exam-simulator-section">
                    {/* DYNAMIC ON-DEMAND RESEARCH LOADER SCREEN */}
                    {mockLoading && (
                        <div className="dynamic-research-loader-panel">
                            <div className="research-radar-ring">
                                <span className="research-pulsing-icon">🔬</span>
                            </div>
                            <div className="research-status-texts">
                                <span className="research-badge-tag">DOCMIND AI • ON-DEMAND EXAM INTELLIGENCE</span>
                                <h2 className="research-main-title">
                                    Researching Official Pattern & PYQs for: <br />
                                    <span className="highlight-target-exam">{researchingExamTitle || "Government Examination"}</span>
                                </h2>
                                <p className="research-subtext">
                                    Conducting deep historical analysis on conducting board standards, official syllabus shifts, and authentic Previous Year Questions.
                                </p>

                                <div className="research-steps-timeline">
                                    <div className={`step-item ${researchStage >= 1 ? "active" : ""}`}>
                                        <span className="step-circle">{researchStage > 1 ? "✓" : "1"}</span>
                                        <div className="step-content">
                                            <strong>Conducting Agency & Historical Blueprint</strong>
                                            <span>Analyzing TCS iON / Board shift structure, duration, and negative marking penalty</span>
                                        </div>
                                    </div>
                                    <div className={`step-item ${researchStage >= 2 ? "active" : ""}`}>
                                        <span className="step-circle">{researchStage > 2 ? "✓" : "2"}</span>
                                        <div className="step-content">
                                            <strong>Syllabus & Weightage Decomposition</strong>
                                            <span>Extracting multi-year question frequency across Reasoning, Math, GA, & Core Domain</span>
                                        </div>
                                    </div>
                                    <div className={`step-item ${researchStage >= 3 ? "active" : ""}`}>
                                        <span className="step-circle">{researchStage >= 3 ? "⚡" : "3"}</span>
                                        <div className="step-content">
                                            <strong>{selectedExamMode === "full_paper" ? "Synthesizing 100 Questions across 4 Official Sections" : "Synthesizing 20 High-Yield Speed Drill Questions"}</strong>
                                            <span>{selectedExamMode === "full_paper" ? "Parallel board section assembly with authentic marking penalties and step-by-step derivations" : "Formulating focused speed practice with full step-by-step solutions"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="research-progress-bar-wrap">
                                    <div className="research-progress-bar-fill" style={{ width: `${researchStage * 33.3}%` }}></div>
                                </div>
                                <span className="research-security-note">🔒 Official Question Paper Integrity • Anti-Cheating Protocol Simulation</span>
                            </div>
                        </div>
                    )}

                    {!mockLoading && !isTestActive && !isSubmitted && (
                        /* Exam Launcher Dashboard */
                        <div className="simulator-launcher-card">
                            <div className="launcher-header">
                                <span className="launcher-badge">🎯 Authentic Government Exam Arena</span>
                                <h2>Practice ANY Indian Government Examination On-Demand</h2>
                                <p>
                                    Select from top featured examinations or pick from any of the {exams.length} live government notifications. DocMind AI dynamically researches the historical pattern, syllabus stages, marking scheme, and generates an authentic 15+ question PYQ simulation.
                                </p>
                            </div>

                            {/* Instant Live Exam Search & Launch Bar */}
                            <div className="live-exam-picker-box">
                                <div className="picker-label-row">
                                    <span className="picker-icon">⚡</span>
                                    <strong>Practice Any Live Exam Notification on Platform:</strong>
                                </div>
                                <div className="picker-controls-row">
                                    <input
                                        type="text"
                                        className="picker-search-input"
                                        placeholder="Type exam or board name (e.g., Punjab Police, RRB NTPC, Supreme Court, ISRO)..."
                                        value={customSearchExam}
                                        onChange={(e) => setCustomSearchExam(e.target.value)}
                                    />
                                    <button
                                        className="btn-picker-launch"
                                        disabled={!customSearchExam.trim()}
                                        onClick={() => {
                                            const matched = exams.find(e => 
                                                e.title.toLowerCase().includes(customSearchExam.toLowerCase()) || 
                                                e.organization.toLowerCase().includes(customSearchExam.toLowerCase())
                                            );
                                            if (matched) {
                                                openPracticeModal(matched);
                                            } else {
                                                openPracticeModal({
                                                    title: customSearchExam,
                                                    organization: "Official Recruitment Board",
                                                    domain: "general_admin"
                                                });
                                            }
                                        }}
                                    >
                                        <span>🔬 Research & Start Test →</span>
                                    </button>
                                </div>

                                {customSearchExam.trim().length > 1 && (
                                    <div className="picker-instant-results">
                                        {exams
                                            .filter(e => 
                                                e.title.toLowerCase().includes(customSearchExam.toLowerCase()) ||
                                                e.organization.toLowerCase().includes(customSearchExam.toLowerCase())
                                            )
                                            .slice(0, 5)
                                            .map((e, idx) => (
                                                <button
                                                    key={idx}
                                                    className="picker-result-pill"
                                                    onClick={() => openPracticeModal(e)}
                                                >
                                                    <strong>{e.title}</strong>
                                                    <span>({e.organization})</span>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Featured Exam Cards Grid */}
                            <div className="featured-section-title">
                                <span>🏛️ Popular National Examinations</span>
                            </div>

                            <div className="simulator-exam-choices-grid">
                                {[
                                    {
                                        id: "ssc_cgl",
                                        name: "SSC CGL (Combined Graduate Level)",
                                        agency: "Staff Selection Commission (TCS iON)",
                                        questions: "15 Authentic PYQs",
                                        duration: "20 Mins",
                                        scheme: "+2.00 / -0.50 Mark Penalty",
                                        sections: "Reasoning, GA, Quantitative, English",
                                        icon: "🇮🇳"
                                    },
                                    {
                                        id: "rrb_ntpc",
                                        name: "RRB NTPC / Railway Recruitment Boards",
                                        agency: "Ministry of Railways / TCS iON",
                                        questions: "15 Authentic PYQs",
                                        duration: "20 Mins",
                                        scheme: "+1.00 / -0.33 Mark Penalty (1/3rd)",
                                        sections: "Mathematics, Reasoning, General Science, Railways GK",
                                        icon: "🚆"
                                    },
                                    {
                                        id: "ibps_sbi_po",
                                        name: "IBPS PO / SBI PO Prelims Examination",
                                        agency: "Institute of Banking Personnel Selection",
                                        questions: "15 Authentic PYQs",
                                        duration: "20 Mins",
                                        scheme: "+1.00 / -0.25 Mark Penalty",
                                        sections: "Data Interpretation, Puzzles, Banking Awareness",
                                        icon: "🏦"
                                    },
                                    {
                                        id: "police_constable",
                                        name: "State Police Constable & Sub-Inspector",
                                        agency: "State Police Recruitment & Promotion Board",
                                        questions: "15 Authentic PYQs",
                                        duration: "20 Mins",
                                        scheme: "+2.00 / -0.50 Mark Penalty",
                                        sections: "Law & Constitution, Mental Ability, Numerical, GK",
                                        icon: "🎖️"
                                    },
                                    {
                                        id: "upsc_csat",
                                        name: "UPSC Civil Services CSAT Paper-2",
                                        agency: "Union Public Service Commission (Dholpur House)",
                                        questions: "15 Analytical CSAT Qs",
                                        duration: "25 Mins",
                                        scheme: "+2.50 / -0.83 Mark Penalty (1/3rd)",
                                        sections: "Reading Comprehension, Basic Numeracy, Logic",
                                        icon: "🏛️"
                                    },
                                    {
                                        id: "isro_technical",
                                        name: "ISRO / DRDO Technical & Scientific",
                                        agency: "ISRO Centralised Recruitment Board (ICRB)",
                                        questions: "15 Authentic PYQs",
                                        duration: "20 Mins",
                                        scheme: "+3.00 / -0.75 Mark Penalty",
                                        sections: "Technical Domain, Mathematics, Analytical Reasoning",
                                        icon: "🚀"
                                    }
                                ].map((sim) => (
                                    <div key={sim.id} className="sim-choice-card">
                                        <div className="sim-choice-top">
                                            <span className="sim-choice-icon">{sim.icon}</span>
                                            <div>
                                                <h3>{sim.name}</h3>
                                                <span className="sim-agency">{sim.agency}</span>
                                            </div>
                                        </div>

                                        <div className="sim-details-list">
                                            <span>⏱️ <strong>Duration:</strong> {sim.duration}</span>
                                            <span>📋 <strong>Format:</strong> {sim.questions}</span>
                                            <span>⚖️ <strong>Marking:</strong> {sim.scheme}</span>
                                            <span>📚 <strong>Syllabus:</strong> {sim.sections}</span>
                                        </div>

                                        <button
                                            className="btn-start-sim-test"
                                            onClick={() => openPracticeModal({
                                                title: sim.name,
                                                organization: sim.agency,
                                                domain: sim.id
                                            })}
                                            disabled={mockLoading}
                                        >
                                            Practice Exam PYQs ⚡
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LIVE ACTIVE EXAMINATION ARENA */}
                    {!mockLoading && isTestActive && mockTestData && (
                        <div className="live-exam-arena">
                            {/* Researched Pattern & Conducting Body Blueprint Banner */}
                            <div className="arena-research-banner">
                                <div className="banner-left-info">
                                    <span className="banner-board-tag">🏛️ Conducting Body: {mockTestData.conductingBody}</span>
                                    <h4 className="banner-exam-title">{mockTestData.examName}</h4>
                                    <p className="banner-pattern-desc">{mockTestData.historicalPattern}</p>
                                </div>
                                <div className="banner-right-meta">
                                    <div className="meta-badge-item">
                                        <span className="badge-k">Marking Scheme:</span>
                                        <strong className="badge-v">{mockTestData.markingScheme.correct} / {mockTestData.markingScheme.incorrect}</strong>
                                    </div>
                                    <div className="meta-badge-item">
                                        <span className="badge-k">Benchmark Cutoff:</span>
                                        <strong className="badge-v">{mockTestData.expectedCutoffPercent}%</strong>
                                    </div>
                                    <div className="meta-badge-item">
                                        <span className="badge-k">Format:</span>
                                        <strong className="badge-v">{mockTestData.totalQuestions || mockTestData.questions?.length || 20} Authentic PYQs</strong>
                                    </div>
                                    <div className="meta-badge-item">
                                        <span className="badge-k">Mode:</span>
                                        <strong className="badge-v">{mockTestData.mode === "full_paper" ? "🏆 100-Q Full CBT" : "⚡ 20-Q Speed Drill"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Top Proctor Bar */}
                            <div className="arena-top-bar">
                                <div className="arena-exam-info">
                                    <span className="arena-live-dot">● PROCTORED EXAMINATION</span>
                                    <h3>{mockTestData.examName}</h3>
                                </div>

                                <div className="arena-timer-box">
                                    <span className="timer-icon">⏳</span>
                                    <strong className={`timer-digits ${timeLeftSeconds < 120 ? "timer-warning" : ""}`}>
                                        {formatTime(timeLeftSeconds)}
                                    </strong>
                                </div>

                                <button
                                    className="btn-finish-exam"
                                    onClick={handleSubmitTest}
                                >
                                    Submit Examination →
                                </button>
                            </div>

                            {/* Section Navigation Tabs */}
                            {mockTestData.questions && (
                                <div className="arena-section-tabs-bar">
                                    <span className="section-tab-lbl">📚 Sections:</span>
                                    {["all", ...new Set(mockTestData.questions.map(q => q.section).filter(Boolean))].map(sec => (
                                        <button
                                            key={sec}
                                            className={`arena-sec-tab ${activeSectionFilter === sec ? "active" : ""}`}
                                            onClick={() => setActiveSectionFilter(sec)}
                                        >
                                            {sec === "all" ? `All Sections (${mockTestData.questions.length})` : sec}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Arena Dual Grid */}
                            <div className="arena-workspace-grid">
                                {/* Question Pane */}
                                <div className="arena-question-pane">
                                    {(() => {
                                        const q = mockTestData.questions[currentQuestionIndex];
                                        if (!q) return null;
                                        const isAnswered = userAnswers[q.id] !== undefined;

                                        return (
                                            <div className="question-content-box">
                                                <div className="question-header-row">
                                                    <div className="q-badge-group">
                                                        <span className="q-number-badge">Question {currentQuestionIndex + 1} of {mockTestData.questions.length}</span>
                                                        <span className="q-section-badge">{q.section}</span>
                                                        {q.pyqYear && (
                                                            <span className="q-pyq-pill">📜 {q.pyqYear}</span>
                                                        )}
                                                        <span className={`q-diff-badge diff-${q.difficulty ? q.difficulty.toLowerCase() : "medium"}`}>
                                                            {q.difficulty || "Medium"}
                                                        </span>
                                                    </div>

                                                    <div className="q-marks-scheme">
                                                        <span>Correct: <strong>{mockTestData.markingScheme.correct}</strong></span>
                                                        <span>Penalty: <strong className="penalty-text">{mockTestData.markingScheme.incorrect}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="question-text-area">
                                                    <p>{q.question}</p>
                                                </div>

                                                {/* Options List */}
                                                <div className="options-grid">
                                                    {q.options.map((optText, oIdx) => {
                                                        const isSelected = userAnswers[q.id] === oIdx;
                                                        return (
                                                            <button
                                                                key={oIdx}
                                                                className={`option-card ${isSelected ? "selected" : ""}`}
                                                                onClick={() => {
                                                                    setUserAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                                                                }}
                                                            >
                                                                <span className="option-letter">{String.fromCharCode(65 + oIdx)}</span>
                                                                <span className="option-text">{optText}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Bottom Nav Bar */}
                                                <div className="question-nav-footer">
                                                    <div className="footer-left-actions">
                                                        <button
                                                            className="btn-nav-control"
                                                            disabled={currentQuestionIndex === 0}
                                                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                                        >
                                                            ← Previous
                                                        </button>

                                                        <button
                                                            className="btn-nav-control"
                                                            disabled={currentQuestionIndex === mockTestData.questions.length - 1}
                                                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                                        >
                                                            Next →
                                                        </button>
                                                    </div>

                                                    <div className="footer-right-actions">
                                                        <button
                                                            className={`btn-review-toggle ${markedReview[q.id] ? "is-marked" : ""}`}
                                                            onClick={() => {
                                                                setMarkedReview(prev => ({ ...prev, [q.id]: !prev[q.id] }));
                                                            }}
                                                        >
                                                            {markedReview[q.id] ? "★ Marked for Review" : "☆ Mark for Review"}
                                                        </button>

                                                        {isAnswered && (
                                                            <button
                                                                className="btn-clear-choice"
                                                                onClick={() => {
                                                                    setUserAnswers(prev => {
                                                                        const copy = { ...prev };
                                                                        delete copy[q.id];
                                                                        return copy;
                                                                    });
                                                                }}
                                                            >
                                                                Clear Choice
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Right Question Palette */}
                                <div className="arena-palette-sidebar">
                                    <h4 className="palette-title">Question Palette</h4>
                                    
                                    <div className="palette-stats-row">
                                        <div className="p-stat"><span className="color-dot dot-answered"></span> Answered ({Object.keys(userAnswers).length})</div>
                                        <div className="p-stat"><span className="color-dot dot-review"></span> Review ({Object.keys(markedReview).filter(k => markedReview[k]).length})</div>
                                        <div className="p-stat"><span className="color-dot dot-unanswered"></span> Pending ({mockTestData.questions.length - Object.keys(userAnswers).length})</div>
                                    </div>

                                    {/* Quick Section Jumpers for Multi-Section Navigation */}
                                    {mockTestData.questions && (
                                        <div className="palette-section-jumpers">
                                            <button 
                                                className={`jump-btn ${activeSectionFilter === "all" ? "active" : ""}`} 
                                                onClick={() => setActiveSectionFilter("all")}
                                            >
                                                All ({mockTestData.questions.length})
                                            </button>
                                            {Array.from(new Set(mockTestData.questions.map(q => q.section))).map((secName, sIdx) => {
                                                const secQs = mockTestData.questions.filter(q => q.section === secName);
                                                return (
                                                    <button 
                                                        key={sIdx}
                                                        className={`jump-btn ${activeSectionFilter === secName ? "active" : ""}`}
                                                        onClick={() => {
                                                            setActiveSectionFilter(secName);
                                                            const firstIdx = mockTestData.questions.findIndex(q => q.section === secName);
                                                            if (firstIdx !== -1) setCurrentQuestionIndex(firstIdx);
                                                        }}
                                                        title={secName}
                                                    >
                                                        {secName.split(" ")[0]} ({secQs.length})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="palette-grid-buttons">
                                        {mockTestData.questions.map((q, idx) => {
                                            const isAnswered = userAnswers[q.id] !== undefined;
                                            const isMarked = markedReview[q.id];
                                            const isCurrent = currentQuestionIndex === idx;
                                            const isFiltered = activeSectionFilter !== "all" && q.section !== activeSectionFilter;

                                            return (
                                                <button
                                                    key={q.id}
                                                    className={`palette-num-btn ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""} ${isMarked ? "marked" : ""} ${isFiltered ? "dimmed-out" : ""}`}
                                                    onClick={() => setCurrentQuestionIndex(idx)}
                                                    title={`${q.section} (${q.pyqYear || "PYQ"})`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {mockTestData.strategyTips && Array.isArray(mockTestData.strategyTips) && (
                                        <div className="palette-strategy-card">
                                            <h5>💡 Board Strategy Tips</h5>
                                            <ul>
                                                {mockTestData.strategyTips.map((tip, tIdx) => (
                                                    <li key={tIdx}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="palette-rules-card">
                                        <h5>Official Examination Rules</h5>
                                        <ul>
                                            {mockTestData.rules.map((rule, rIdx) => (
                                                <li key={rIdx}>{rule}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* POST-EXAM COMPREHENSIVE SCORECARD & QUESTION REVIEW */}
                    {!mockLoading && isSubmitted && scorecard && mockTestData && (
                        <div className="exam-scorecard-panel">
                            {/* Score Banner */}
                            <div className="scorecard-top-summary">
                                <div className="scorecard-main-score">
                                    <span className="score-label">Your Final Projected Score</span>
                                    <h2 className="score-digits">{scorecard.rawScore} <span className="max-score">/ {scorecard.maxScore}</span></h2>
                                    <span className={`cutoff-badge ${scorecard.percentage >= scorecard.expectedCutoffPercent ? "cleared" : "not-cleared"}`}>
                                        {scorecard.cutoffStatus}
                                    </span>
                                </div>

                                <div className="scorecard-breakdown-stats">
                                    <div className="stat-card green">
                                        <span className="stat-val">{scorecard.correctCount}</span>
                                        <span className="stat-lbl">Correct Answers</span>
                                    </div>
                                    <div className="stat-card red">
                                        <span className="stat-val">{scorecard.incorrectCount}</span>
                                        <span className="stat-lbl">Negative Penalties</span>
                                    </div>
                                    <div className="stat-card gray">
                                        <span className="stat-val">{scorecard.skippedCount}</span>
                                        <span className="stat-lbl">Unattempted Qs</span>
                                    </div>
                                    <div className="stat-card purple">
                                        <span className="stat-val">{scorecard.percentage}%</span>
                                        <span className="stat-lbl">Net Accuracy</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-retake-exam"
                                    onClick={() => openPracticeModal(mockTestData || simExamKey)}
                                >
                                    🔄 Retake / Practice Another Exam
                                </button>
                            </div>

                            {/* Section-Wise Performance Breakdown Table */}
                            {scorecard.sectionBreakdown && Object.keys(scorecard.sectionBreakdown).length > 0 && (
                                <div className="section-analytics-card">
                                    <h4 className="analytics-title">📊 Subject-Wise Performance & Accuracy Analysis</h4>
                                    <div className="analytics-table-wrap">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th>Exam Section</th>
                                                    <th>Total Qs</th>
                                                    <th>Correct</th>
                                                    <th>Incorrect</th>
                                                    <th>Skipped</th>
                                                    <th>Accuracy</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(scorecard.sectionBreakdown).map(([secName, sData], sIdx) => {
                                                    const attempted = sData.correct + sData.incorrect;
                                                    const secAccuracy = attempted > 0 ? Math.round((sData.correct / attempted) * 100) : 0;
                                                    return (
                                                        <tr key={sIdx}>
                                                            <td><strong>{secName}</strong></td>
                                                            <td>{sData.total}</td>
                                                            <td className="text-correct-bold">+{sData.correct}</td>
                                                            <td className="text-wrong-bold">-{sData.incorrect}</td>
                                                            <td>{sData.skipped}</td>
                                                            <td>
                                                                <span className={`accuracy-pill ${secAccuracy >= 70 ? "acc-high" : secAccuracy >= 40 ? "acc-med" : "acc-low"}`}>
                                                                    {secAccuracy}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Question Review & Step-by-Step Solutions */}
                            <div className="scorecard-questions-review">
                                <h3 className="review-heading">📝 Step-by-Step Question Solutions & Explanations</h3>

                                <div className="review-cards-list">
                                    {mockTestData.questions.map((q, idx) => {
                                        const chosenIndex = userAnswers[q.id];
                                        const isCorrect = chosenIndex === q.correctIndex;
                                        const isSkipped = chosenIndex === undefined;

                                        return (
                                            <div 
                                                key={q.id} 
                                                className={`solution-review-card ${isCorrect ? "card-correct" : isSkipped ? "card-skipped" : "card-wrong"}`}
                                            >
                                                <div className="solution-card-top">
                                                    <div className="solution-top-left">
                                                        <span className="solution-q-num">Question {idx + 1} • {q.section}</span>
                                                        {q.pyqYear && (
                                                            <span className="solution-pyq-badge">📜 {q.pyqYear}</span>
                                                        )}
                                                    </div>
                                                    <span className={`solution-status-pill ${isCorrect ? "pill-correct" : isSkipped ? "pill-skipped" : "pill-wrong"}`}>
                                                        {isCorrect ? "✓ Correct (+marks)" : isSkipped ? "○ Skipped (0 marks)" : "✕ Incorrect (-penalty)"}
                                                    </span>
                                                </div>

                                                <p className="solution-q-text">{q.question}</p>

                                                <div className="options-comparison-row">
                                                    <div className="opt-comp-col">
                                                        <span className="comp-label">Your Selection:</span>
                                                        <strong>
                                                            {chosenIndex !== undefined 
                                                                ? `${String.fromCharCode(65 + chosenIndex)}. ${q.options[chosenIndex]}`
                                                                : "Not Attempted"}
                                                        </strong>
                                                    </div>

                                                    <div className="opt-comp-col">
                                                        <span className="comp-label">Correct Official Answer:</span>
                                                        <strong className="text-correct">
                                                            {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="solution-explanation-box">
                                                    <strong>💡 Official Concept & Step-by-Step Derivation:</strong>
                                                    <pre className="explanation-pre">{q.explanation}</pre>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Official Circular Email Briefing Modal */}
            {emailModalExam && (
                <div className="exam-mode-modal-backdrop" onClick={() => setEmailModalExam(null)}>
                    <div className="modal-card modal-small" onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "520px", width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
                        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "24px" }}>✉️</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", fontWeight: "700" }}>Receive Official Circular Briefing</h3>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>Dispatched to your student email & placement mailbox</span>
                                </div>
                            </div>
                            <button className="modal-close-btn" onClick={() => setEmailModalExam(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        
                        <div className="modal-body">
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                                <strong style={{ display: "block", color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>🏛️ {emailModalExam.title}</strong>
                                <div style={{ fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span>🏢 <strong>Board:</strong> {emailModalExam.organization}</span>
                                    <span>💰 <strong>Pay Scale:</strong> {emailModalExam.salary_or_stipend || "As per 7th CPC norms"}</span>
                                    <span>📅 <strong>Closing Date:</strong> {emailModalExam.deadline ? new Date(emailModalExam.deadline).toLocaleDateString("en-IN") : "Refer Official Gazette"}</span>
                                </div>
                            </div>

                            {emailSentSuccess ? (
                                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "14px", textAlign: "center", color: "#065f46" }}>
                                    <span style={{ fontSize: "20px", display: "block", marginBottom: "4px" }}>✓</span>
                                    <strong>Official circular briefing successfully dispatched!</strong>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Check your inbox and your DocMind Placement Mailbox.</p>
                                </div>
                            ) : (
                                <div className="form-group" style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                        Confirm Email Address:
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="e.g. student@gmail.com"
                                        value={alertEmailInput || candidateData?.email || ""}
                                        onChange={(e) => setAlertEmailInput(e.target.value)}
                                        className="form-input"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                    />
                                    <span style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                                        Includes syllabus breakdown, document scrutiny checklist, and portal links.
                                    </span>
                                </div>
                            )}
                        </div>

                        {!emailSentSuccess && (
                            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setEmailModalExam(null)}
                                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSendEmailAlert}
                                    disabled={emailSending}
                                    style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    {emailSending ? "Dispatching..." : "✉️ Send Official Briefing"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* PRE-EXAM CHOICE SELECTOR MODAL (Speed Drill vs 100-Q Full Simulation) */}
            {practiceModalExam && (
                <div className="exam-mode-modal-backdrop" onClick={() => setPracticeModalExam(null)}>
                    <div className="exam-mode-modal-card" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setPracticeModalExam(null)}>×</button>

                        <div className="exam-mode-header">
                            <span className="exam-mode-org-badge">
                                {practiceModalExam.organization || "Official Recruitment Authority"}
                            </span>
                            <h2 className="exam-mode-title">{practiceModalExam.title}</h2>
                            <p className="exam-mode-subtitle">
                                Select your practice mode. DOCMIND AI custom-synthesizes the paper adhering to official board negative marking and domain qualification rules.
                            </p>

                            {/* Domain & Qualification Differentiation Indicator */}
                            {(() => {
                                const t = (practiceModalExam.title || "").toLowerCase();
                                const isSteno = t.includes("steno");
                                const isJE = t.includes("engineer") || t.includes("je ") || t.includes("technical") || t.includes("isro") || t.includes("drdo");
                                const isPolice = t.includes("police") || t.includes("constable") || t.includes("sub-inspector") || t.includes("si ");
                                const isRailways = t.includes("railway") || t.includes("rrb") || t.includes("alp");
                                const isMTS = t.includes("mts") || t.includes("group d") || t.includes("attendant");
                                const isBank = t.includes("bank") || t.includes("ibps") || t.includes("sbi") || t.includes("po ");

                                let notice = "🏛️ Central Graduate Pattern: Quantitative Aptitude, Reasoning, GA & English Comprehension.";
                                if (isSteno) notice = "🎯 Official Pattern Detected: ZERO Mathematics. 50% English Language & Cloze Test weightage.";
                                else if (isJE) notice = "⚙️ Official Pattern Detected: 50% Core Technical Engineering & Applied Science.";
                                else if (isPolice) notice = "👮 Official Pattern Detected: Criminal Law (BNS/BNSS), Constitutional Writs & Police SOPs.";
                                else if (isRailways) notice = "🚆 Official Pattern Detected: Class 9-10 NCERT Science & Indian Railways Technology (-0.33 Negative).";
                                else if (isMTS) notice = "📚 Matriculation Pattern: Class 10 Elementary Arithmetic & Everyday Life Science.";
                                else if (isBank) notice = "🏦 Banking Pattern: High-Level Puzzles, Caselet DI & Financial Awareness (-0.25 Negative).";

                                return (
                                    <div className="exam-mode-domain-pill">
                                        <span>{notice}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Selection Grid: Mode A vs Mode B */}
                        <div className="exam-mode-selection-grid">
                            {/* Mode A: Speed Drill */}
                            <div 
                                className={`exam-mode-card ${selectedExamMode === "speed_drill" ? "selected" : ""}`}
                                onClick={() => setSelectedExamMode("speed_drill")}
                            >
                                <div className="mode-card-header">
                                    <div className="mode-icon-circle fast">⚡</div>
                                    <div>
                                        <span className="mode-badge-tag fast">RECOMMENDED FOR DAILY PRACTICE</span>
                                        <h3 className="mode-card-title">Quick 20-Question Speed Drill</h3>
                                    </div>
                                </div>

                                <div className="mode-card-metrics">
                                    <div className="metric-item">
                                        <span className="metric-val">20</span>
                                        <span className="metric-lbl">High-Yield Qs</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-val">25 min</span>
                                        <span className="metric-lbl">Speed Timer</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-val">4</span>
                                        <span className="metric-lbl">Key Sections</span>
                                    </div>
                                </div>

                                <ul className="mode-features-list">
                                    <li><span>⏱️</span> <strong>25 Minutes Live Clock:</strong> Build rapid solving momentum</li>
                                    <li><span>🎯</span> <strong>5 Qs per Official Section:</strong> Balanced subject evaluation</li>
                                    <li><span>⚖️</span> <strong>Real Negative Marking:</strong> Train penalty discipline</li>
                                    <li><span>💡</span> <strong>Instant Scorecard & Solutions:</strong> Full step-by-step review</li>
                                </ul>

                                <div className="mode-card-footer">
                                    <span className={`mode-select-radio ${selectedExamMode === "speed_drill" ? "checked" : ""}`}>
                                        {selectedExamMode === "speed_drill" ? "✓ Selected" : "Select Speed Drill"}
                                    </span>
                                </div>
                            </div>

                            {/* Mode B: Full 100-Question Board Simulation */}
                            <div 
                                className={`exam-mode-card ${selectedExamMode === "full_paper" ? "selected" : ""}`}
                                onClick={() => setSelectedExamMode("full_paper")}
                            >
                                <div className="mode-card-header">
                                    <div className="mode-icon-circle full">🏆</div>
                                    <div>
                                        <span className="mode-badge-tag full">REAL EXAM REPLICA</span>
                                        <h3 className="mode-card-title">Full 100-Question Board Simulation</h3>
                                    </div>
                                </div>

                                <div className="mode-card-metrics">
                                    <div className="metric-item">
                                        <span className="metric-val">100</span>
                                        <span className="metric-lbl">Total Questions</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-val">90 min</span>
                                        <span className="metric-lbl">Official Clock</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-val">100%</span>
                                        <span className="metric-lbl">Full Board CBT</span>
                                    </div>
                                </div>

                                <ul className="mode-features-list">
                                    <li><span>⏱️</span> <strong>90 Minutes (1.5 Hours):</strong> Real examination stamina builder</li>
                                    <li><span>📋</span> <strong>25 Qs in Each Section:</strong> Full depth across all 4 subjects</li>
                                    <li><span>🧠</span> <strong>Interactive 100-Q Palette:</strong> Jump, review, and filter questions</li>
                                    <li><span>📊</span> <strong>Detailed Subject Analytics:</strong> Pinpoint your exact cutoff gap</li>
                                </ul>

                                <div className="mode-card-footer">
                                    <span className={`mode-select-radio ${selectedExamMode === "full_paper" ? "checked" : ""}`}>
                                        {selectedExamMode === "full_paper" ? "✓ Selected" : "Select Full Paper"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="exam-mode-actions">
                            <button className="btn-cancel-modal" onClick={() => setPracticeModalExam(null)}>
                                Cancel
                            </button>
                            <button 
                                className="btn-launch-mode-exam"
                                onClick={() => handleStartMockTest(practiceModalExam, selectedExamMode)}
                            >
                                🚀 Launch Authentic Practice ({selectedExamMode === "full_paper" ? "100 Qs • 90 Mins" : "20 Qs • 25 Mins"})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                MODAL 3: OFFICIAL STATUTORY DOCUMENT VERIFICATION (DV) AUDIT
               ================================================== */}
            {selectedDVAuditExam && (() => {
                const auditData = selectedDVAuditExam.dvAudit || {
                    matchScore: 88,
                    dvStatus: "docs_pending",
                    dvBadgeLabel: "Eligible (Docs Pending)",
                    effectiveAgeBracket: "18 - 30 Years",
                    relaxationApplied: candidateData?.category && candidateData.category !== "General" ? `${candidateData.category} (+3/5 Yrs Relaxation)` : "None (UR)",
                    isAgeEligible: true,
                    isDegreeEligible: true,
                    totalRequiredDocs: 4,
                    verifiedDocsCount: 3,
                    ageNote: `Candidate meets the age limit requirement (${candidateData?.age || 22} Yrs).`,
                    degreeNote: `Academic qualifications (${candidateData?.degree || "Graduate Degree"}) verified for recruitment eligibility.`,
                    domicileStatus: "Open National / State Quota Verified",
                    checklist: [
                        { name: "SSLC / 10th Standard Certificate", status: "verified", statutoryRequirement: "Mandatory date-of-birth proof verified against Document Vault.", matchedDocName: "10th_Marksheet.pdf" },
                        { name: "Graduation Degree Certificate / Provisional", status: "verified", statutoryRequirement: "Essential educational qualification verification for scrutiny.", matchedDocName: "Degree_Certificate.pdf" },
                        { name: "Community / Category Certificate", status: candidateData?.category && candidateData.category !== "General" ? "verified" : "optional", statutoryRequirement: "Statutory proof for age relaxation and category reservation.", matchedDocName: "Community_Certificate.pdf" },
                        { name: "Official Photo Identity Proof (Aadhaar / Passport)", status: "verified", statutoryRequirement: "Government identity verification for examination center biometric scrutiny.", matchedDocName: "Aadhaar_Card.pdf" }
                    ]
                };

                return (
                    <div className="exam-mode-modal-overlay" onClick={() => setSelectedDVAuditExam(null)}>
                        <div className="dv-audit-modal-content" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="dv-audit-modal-header">
                                <div>
                                    <div className="dv-modal-badge">
                                        <span>🏛️ OFFICIAL STATUTORY DOCUMENT VERIFICATION (DV) AUDIT</span>
                                    </div>
                                    <h2 className="dv-modal-title">{selectedDVAuditExam.title}</h2>
                                    <span className="dv-modal-org">{selectedDVAuditExam.organization} • {selectedDVAuditExam.location}</span>
                                </div>
                                <button 
                                    className="btn-close-modal"
                                    onClick={() => setSelectedDVAuditExam(null)}
                                    title="Close modal"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Overview Score Card */}
                            <div className={`dv-modal-score-card status-${auditData.dvStatus}`}>
                                <div className="dv-modal-score-ring">
                                    <div className="score-number">{auditData.matchScore}%</div>
                                    <div className="score-caption">DV Readiness</div>
                                </div>

                                <div className="dv-modal-score-info">
                                    <div className="dv-badge-row">
                                        <span className={`dv-status-pill pill-${auditData.dvStatus}`}>
                                            {auditData.dvStatus === "dv_ready" ? "🟢 100% DV Ready for Board Scrutiny" :
                                             auditData.dvStatus === "docs_pending" ? "🟡 Eligible — Pending Documents in Vault" :
                                             "🔴 Ineligible for this Circular"}
                                        </span>
                                        {auditData.relaxationApplied && (
                                            <span className="relaxation-tag">
                                                ⚡ {auditData.relaxationApplied}
                                            </span>
                                        )}
                                    </div>
                                    <p className="dv-modal-summary-text">
                                        {auditData.dvStatus === "dv_ready" 
                                            ? "All required statutory certificates and proofs are verified in your Document Vault. You meet the age cutoff, educational qualification, and documentation requirements."
                                            : auditData.dvStatus === "docs_pending"
                                            ? `You qualify on Age (${candidateData?.age || 22} yrs) and Qualification (${candidateData?.degree || "Degree"}), but have ${auditData.totalRequiredDocs - auditData.verifiedDocsCount} document(s) pending in your vault before official board document scrutiny.`
                                            : `Candidate does not meet the mandatory criteria: ${auditData.ageNote || auditData.degreeNote}`}
                                    </p>
                                </div>
                            </div>

                        {/* Candidate vs Circular Eligibility Pillars */}
                        <div className="dv-pillars-grid">
                            <div className="dv-pillar-card">
                                <div className="pillar-header">
                                    <span>🎂</span>
                                    <strong>Age & Cutoff Scrutiny</strong>
                                </div>
                                <div className="pillar-body">
                                    <div className="pillar-row">
                                        <span>Candidate Age:</span>
                                        <strong>{candidateData?.age || 22} Years</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Circular Bracket:</span>
                                        <strong>{selectedDVAuditExam.dvAudit.effectiveAgeBracket}</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Relaxation:</span>
                                        <span className="highlight-text">{selectedDVAuditExam.dvAudit.relaxationApplied || "None (General/UR)"}</span>
                                    </div>
                                    <div className={`pillar-status-chip ${selectedDVAuditExam.dvAudit.isAgeEligible ? "pass" : "fail"}`}>
                                        {selectedDVAuditExam.dvAudit.isAgeEligible ? "✓ Age Cutoff Satisfied" : "✗ Age Cutoff Exceeded"}
                                    </div>
                                </div>
                            </div>

                            <div className="dv-pillar-card">
                                <div className="pillar-header">
                                    <span>🎓</span>
                                    <strong>Academic Qualification</strong>
                                </div>
                                <div className="pillar-body">
                                    <div className="pillar-row">
                                        <span>Candidate Degree:</span>
                                        <strong>{candidateData?.degree} ({candidateData?.branch})</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Circular Required:</span>
                                        <strong>{Array.isArray(selectedDVAuditExam.eligible_degrees) ? selectedDVAuditExam.eligible_degrees.join(", ") : "Any Graduate"}</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Evaluation:</span>
                                        <span className="subtle-text">{selectedDVAuditExam.dvAudit.degreeNote}</span>
                                    </div>
                                    <div className={`pillar-status-chip ${selectedDVAuditExam.dvAudit.isDegreeEligible ? "pass" : "fail"}`}>
                                        {selectedDVAuditExam.dvAudit.isDegreeEligible ? "✓ Qualification Approved" : "✗ Degree Ineligible"}
                                    </div>
                                </div>
                            </div>

                            <div className="dv-pillar-card">
                                <div className="pillar-header">
                                    <span>📍</span>
                                    <strong>Domicile & Quota Seat</strong>
                                </div>
                                <div className="pillar-body">
                                    <div className="pillar-row">
                                        <span>Candidate State:</span>
                                        <strong>{candidateData?.domicileState || "All India"}</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Exam Scope:</span>
                                        <strong>{selectedDVAuditExam.location}</strong>
                                    </div>
                                    <div className="pillar-row">
                                        <span>Quota Allocation:</span>
                                        <span className="highlight-text">{selectedDVAuditExam.dvAudit.domicileStatus}</span>
                                    </div>
                                    <div className="pillar-status-chip pass">
                                        ✓ Quota Access Verified
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Official Statutory Checklist */}
                        <div className="dv-checklist-section">
                            <div className="checklist-section-header">
                                <h3>📋 Statutory Document Verification (DV) Checklist</h3>
                                <span className="checklist-counter">
                                    {selectedDVAuditExam.dvAudit.verifiedDocsCount} of {selectedDVAuditExam.dvAudit.totalRequiredDocs} Proofs in Vault
                                </span>
                            </div>

                            <div className="dv-checklist-items-list">
                                {selectedDVAuditExam.dvAudit.checklist.map((item, idx) => (
                                    <div key={idx} className={`dv-checklist-item-card status-${item.status}`}>
                                        <div className="item-icon-col">
                                            {item.status === "verified" ? (
                                                <span className="doc-icon verified">✓</span>
                                            ) : item.status === "pending_upload" ? (
                                                <span className="doc-icon pending">⚠️</span>
                                            ) : (
                                                <span className="doc-icon optional">—</span>
                                            )}
                                        </div>

                                        <div className="item-content-col">
                                            <div className="item-title-row">
                                                <h4 className="item-doc-name">{item.name}</h4>
                                                <span className={`item-status-tag tag-${item.status}`}>
                                                    {item.status === "verified" ? "Verified in Vault" :
                                                     item.status === "pending_upload" ? "Pending in Vault" :
                                                     "Not Required"}
                                                </span>
                                            </div>
                                            <p className="item-statutory-rule">{item.statutoryRequirement}</p>
                                            
                                            {item.matchedDocName && (
                                                <div className="item-matched-file">
                                                    <span>📁 Recognized Vault File:</span>
                                                    <strong>{item.matchedDocName}</strong>
                                                </div>
                                            )}

                                            {item.status === "pending_upload" && (
                                                <div className="item-pending-alert">
                                                    <span>ℹ️ {item.notes}</span>
                                                </div>
                                            )}
                                        </div>

                                        {item.status === "pending_upload" && (
                                            <div className="item-action-col">
                                                <button 
                                                    type="button"
                                                    className="btn-upload-to-vault"
                                                    onClick={() => {
                                                        setSelectedDVAuditExam(null);
                                                        setActivePage("documents");
                                                    }}
                                                    title="Go to Document Vault to upload this document"
                                                >
                                                    <span>📤 Upload</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="dv-modal-footer">
                            <button 
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedDVAuditExam(null);
                                    setActivePage("documents");
                                }}
                            >
                                <span>📁 Manage Vault Documents</span>
                            </button>

                            <button 
                                type="button"
                                className="btn-primary-gradient"
                                onClick={() => {
                                    const examToPractice = selectedDVAuditExam;
                                    setSelectedDVAuditExam(null);
                                    openPracticeModal(examToPractice);
                                }}
                            >
                                <span>🎯 Practice PYQs for this Exam</span>
                            </button>

                            <a 
                                href={selectedDVAuditExam.apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-portal-link"
                            >
                                <span>Official Portal ↗</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        })()}

            {/* ==================================================
                MODAL 4: ADJUST CANDIDATE DV CREDENTIALS MODAL
               ================================================== */}
            {showProfileEditModal && (
                <div className="exam-mode-modal-overlay" onClick={() => setShowProfileEditModal(false)}>
                    <div className="dv-profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dv-audit-modal-header">
                            <div>
                                <div className="dv-modal-badge">
                                    <span>⚙️ CANDIDATE CREDENTIALS RADAR</span>
                                </div>
                                <h2 className="dv-modal-title">Adjust Government Exam DV Credentials</h2>
                                <span className="dv-modal-org">
                                    These credentials are automatically audited against 500+ Indian recruitment circulars to determine statutory age relaxations and domicile quotas.
                                </span>
                            </div>
                            <button 
                                type="button"
                                className="btn-close-modal"
                                onClick={() => setShowProfileEditModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateDVProfile} className="dv-edit-form">
                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label className="form-label">
                                        🎂 Date of Birth (DOB)
                                        <span className="field-hint">Used for cutoff age calculation</span>
                                    </label>
                                    <input 
                                        type="date"
                                        className="form-input"
                                        value={editProfileData.dob}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, dob: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        🏷️ Reservation Category
                                        <span className="field-hint">Determines age relaxation & category quota</span>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={editProfileData.category}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, category: e.target.value })}
                                    >
                                        <option value="General">General / Unreserved (UR) [No Relaxation]</option>
                                        <option value="OBC-NCL">OBC-NCL (Non-Creamy Layer) [+3 Years Age Relaxation]</option>
                                        <option value="SC">SC (Scheduled Caste) [+5 Years Age Relaxation]</option>
                                        <option value="ST">ST (Scheduled Tribe) [+5 Years Age Relaxation]</option>
                                        <option value="EWS">EWS (Economically Weaker Section) [Cutoff Reservation]</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    📍 Domicile / Home State
                                    <span className="field-hint">Unlocks 85%–100% reserved home-state vacancies in State PSC & Police posts</span>
                                </label>
                                <select 
                                    className="form-select"
                                    value={editProfileData.domicileState}
                                    onChange={(e) => setEditProfileData({ ...editProfileData, domicileState: e.target.value })}
                                >
                                    <option value="All India">All India / Open to All</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Delhi">Delhi / NCR</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="West Bengal">West Bengal</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    ⚡ Special Skill Qualifications (Optional)
                                    <span className="field-hint">Enables ministerial, clerical, court, and uniform posts</span>
                                </label>
                                <div className="skill-checkbox-grid">
                                    <label className="checkbox-item">
                                        <input 
                                            type="checkbox"
                                            checked={editProfileData.specialQualifications?.typing || false}
                                            onChange={(e) => setEditProfileData({
                                                ...editProfileData,
                                                specialQualifications: {
                                                    ...editProfileData.specialQualifications,
                                                    typing: e.target.checked
                                                }
                                            })}
                                        />
                                        <span>Typing Speed (30–35 WPM in English/Hindi)</span>
                                    </label>

                                    <label className="checkbox-item">
                                        <input 
                                            type="checkbox"
                                            checked={editProfileData.specialQualifications?.steno || false}
                                            onChange={(e) => setEditProfileData({
                                                ...editProfileData,
                                                specialQualifications: {
                                                    ...editProfileData.specialQualifications,
                                                    steno: e.target.checked
                                                }
                                            })}
                                        />
                                        <span>Shorthand / Stenography (80–100 WPM)</span>
                                    </label>

                                    <label className="checkbox-item">
                                        <input 
                                            type="checkbox"
                                            checked={editProfileData.specialQualifications?.drivingLicense || false}
                                            onChange={(e) => setEditProfileData({
                                                ...editProfileData,
                                                specialQualifications: {
                                                    ...editProfileData.specialQualifications,
                                                    drivingLicense: e.target.checked
                                                }
                                            })}
                                        />
                                        <span>Motor Driving License (LMV / HMV)</span>
                                    </label>

                                    <label className="checkbox-item">
                                        <input 
                                            type="checkbox"
                                            checked={editProfileData.specialQualifications?.computerCert || false}
                                            onChange={(e) => setEditProfileData({
                                                ...editProfileData,
                                                specialQualifications: {
                                                    ...editProfileData.specialQualifications,
                                                    computerCert: e.target.checked
                                                }
                                            })}
                                        />
                                        <span>Computer Course Certificate (CCC / DCA / O-Level)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="dv-modal-footer">
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowProfileEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-primary-gradient"
                                    disabled={updatingProfile}
                                >
                                    {updatingProfile ? "Auditing 500+ Circulars..." : "💾 Save & Re-Audit Matches"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GovernmentExams;
