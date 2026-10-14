import { useState, useEffect, useRef } from "react";

import { API } from "../config";

function CareerAIMentor({ initialCompany = "", initialRole = "", initialTab = "mock-test", setActivePage }) {
    // Modes: 'mock-test', 'interview', 'pyq', 'govt'
    const [activeTab, setActiveTab] = useState(initialTab || "mock-test");

    // Sync tab when prop changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // ==========================================
    // SHARED: COMPANY & ROLE STATE (ZERO CATEGORIZATION / TIERS)
    // ==========================================
    const [selectedCompany, setSelectedCompany] = useState(initialCompany || "Zoho");
    const [customCompanyInput, setCustomCompanyInput] = useState(initialCompany || "");
    const [targetRole, setTargetRole] = useState(initialRole || "Software Development Engineer");
    const [customRoleInput, setCustomRoleInput] = useState(initialRole || "");

    // Neutral popular search chips (NO tier/size categorizations)
    const popularCompanyChips = [
        "Zoho",
        "TCS",
        "Infosys",
        "Cognizant",
        "Wipro",
        "Accenture",
        "Texmo",
        "Pricol",
        "Roots",
        "HashAgile",
        "L&T",
        "TVS",
        "Amazon"
    ];

    const popularRoles = [
        "Software Development Engineer",
        "Frontend Developer",
        "Full-Stack Web Engineer",
        "Data Analyst / Scientist",
        "Core Embedded & IoT Engineer",
        "Core Mechanical Design Engineer",
        "Electrical / VLSI Engineer",
        "Quality & Test Automation Engineer",
        "Finance & Accounts Associate"
    ];

    // ==========================================
    // FULLSCREEN BROWSER HELPERS
    // ==========================================
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showInterviewExitConfirm, setShowInterviewExitConfirm] = useState(false);

    const requestBrowserFullscreen = () => {
        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
            }
        } catch {
            // Fullscreen request ignored or unsupported
        }
    };

    const exitBrowserFullscreen = () => {
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        } catch {
            // Exit fullscreen ignored or unsupported
        }
    };

    const toggleFullscreenMode = () => {
        if (!document.fullscreenElement) {
            requestBrowserFullscreen();
        } else {
            exitBrowserFullscreen();
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    // Helper to sanitize LaTeX math symbols into clean plain text
    const formatLatexClean = (text) => {
        if (!text || typeof text !== "string") return text || "";
        return text
            .replace(/\\le\b/g, "<=")
            .replace(/\\ge\b/g, ">=")
            .replace(/\\ne\b/g, "!=")
            .replace(/\\times\b/g, "x")
            .replace(/\$([^$]+)\$/g, "$1")
            .replace(/\$/g, "");
    };

    // ==========================================
    // 1. STATE: COMPANY MOCK TEST & LEETCODE ARENA
    // ==========================================
    const [mockTestData, setMockTestData] = useState(null);
    const [mockLoading, setMockLoading] = useState(false);
    const [mockError, setMockError] = useState(null);
    const [testState, setTestState] = useState("ready"); // 'ready', 'in-progress', 'completed'
    const [mockSubTab, setMockSubTab] = useState("mcq"); // 'mcq', 'coding'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionIndex }
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 mins
    const [testScore, setTestScore] = useState(null);

    // LeetCode Coding Arena States
    const [activeCodingProblemId, setActiveCodingProblemId] = useState("code-1");
    const [codingLanguage, setCodingLanguage] = useState("javascript");
    const [candidateCode, setCandidateCode] = useState("");
    const [codeEvaluating, setCodeEvaluating] = useState(false);
    const [codeEvalResult, setCodeEvalResult] = useState(null);
    const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
    const [activeConsoleTab, setActiveConsoleTab] = useState("testcase"); // 'testcase' or 'result'
    const [runMode, setRunMode] = useState("run"); // 'run' or 'submit'
    const [reviewFilter, setReviewFilter] = useState("all"); // 'all', 'correct', 'incorrect', 'skipped'
    const [reviewSubTab, setReviewSubTab] = useState("mcq"); // 'mcq', 'coding'
    const [userCodingSubmissions, setUserCodingSubmissions] = useState({}); // { [probId]: { code, language, evalResult } }

    // ==========================================
    // 2. STATE: AI VOICE INTERVIEWER
    // ==========================================
    const [interviewCompany, setInterviewCompany] = useState(initialCompany || "Texmo Precision");
    const [interviewRole, setInterviewRole] = useState(initialRole || "Software Development Engineer");
    const [interviewRoomActive, setInterviewRoomActive] = useState(false);
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [studentAnswerInput, setStudentAnswerInput] = useState("");
    const [interviewLoading, setInterviewLoading] = useState(false);
    const [latestEvaluation, setLatestEvaluation] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoReadQuestion, setAutoReadQuestion] = useState(true);
    const recognitionRef = useRef(null);

    // ==========================================
    // 2b. STATE: PERSONAL AI VOICE COMMUNICATION COACH
    // ==========================================
    const [interviewSubMode, setInterviewSubMode] = useState("coach"); // 'coach' or 'company'
    const [coachTopic, setCoachTopic] = useState("elevator_pitch");
    const [coachTopicsData, setCoachTopicsData] = useState(null);
    const [activeCoachPrompt, setActiveCoachPrompt] = useState(
        "Can you introduce yourself, highlight your core engineering strengths, and explain what makes you stand out for a campus placement?"
    );
    const [coachTranscript, setCoachTranscript] = useState("");
    const [coachEvaluation, setCoachEvaluation] = useState(null);
    const [coachLoading, setCoachLoading] = useState(false);
    const [coachSpeakingDuration, setCoachSpeakingDuration] = useState(0);
    const [coachHistory, setCoachHistory] = useState([]);
    const [isCoachListening, setIsCoachListening] = useState(false);
    const [coachAudioPlaying, setCoachAudioPlaying] = useState(false);
    const coachRecognitionRef = useRef(null);
    const coachTimerRef = useRef(null);


    // ==========================================
    // 3. STATE: COMPANY PYQ VAULT
    // ==========================================
    const [pyqData, setPyqData] = useState(null);
    const [pyqLoading, setPyqLoading] = useState(false);
    const [pyqError, setPyqError] = useState(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState(null);
    const [pyqRoundFilter, setPyqRoundFilter] = useState("all");
    const [copiedAnswerId, setCopiedAnswerId] = useState(null);

    // ==========================================
    // 4. STATE: GOVT EXAM COACH
    // ==========================================
    const [selectedGovtExam, setSelectedGovtExam] = useState("upsc");
    const [govtData, setGovtData] = useState(null);
    const [govtLoading, setGovtLoading] = useState(false);

    // Sync initial props
    useEffect(() => {
        if (initialCompany) {
            setSelectedCompany(initialCompany);
            setCustomCompanyInput(initialCompany);
            setInterviewCompany(initialCompany);
        }
        if (initialRole) {
            setTargetRole(initialRole);
            setCustomRoleInput(initialRole);
            setInterviewRole(initialRole);
        }
    }, [initialCompany, initialRole]);

    // Mock test countdown timer
    useEffect(() => {
        let timer = null;
        if (testState === "in-progress" && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [testState, timeRemaining]);

    // Initial mock test load
    useEffect(() => {
        if (activeTab === "mock-test" && !mockTestData && !mockLoading) {
            const comp = selectedCompany || initialCompany || "Zoho";
            const rle = targetRole || initialRole || "Software Development Engineer";
            fetchMockTest(comp, rle);
        }
    }, [activeTab, selectedCompany, targetRole, initialCompany]);

    // Initial interview question load
    useEffect(() => {
        if (activeTab === "interview" && (!currentQuestion || (initialCompany && interviewCompany !== initialCompany))) {
            const comp = interviewCompany || initialCompany || "Texmo Precision";
            const rle = interviewRole || initialRole || "Software Development Engineer";
            fetchInitialInterviewQuestion(comp, rle);
        }
    }, [activeTab, interviewCompany, interviewRole, initialCompany]);

    // Starter code updater
    useEffect(() => {
        if (mockTestData?.codingSection) {
            const prob = mockTestData.codingSection.find((p) => p.id === activeCodingProblemId) || mockTestData.codingSection[0];
            if (prob?.starterTemplates?.[codingLanguage]) {
                setCandidateCode(prob.starterTemplates[codingLanguage]);
            }
        }
    }, [activeCodingProblemId, codingLanguage, mockTestData]);

    // Fetch PYQ data
    useEffect(() => {
        if (activeTab === "pyq" && (selectedCompany || initialCompany)) {
            fetchCompanyPYQs(selectedCompany || initialCompany, targetRole || initialRole);
        }
    }, [selectedCompany, targetRole, activeTab]);

    // ==========================================
    // API CALLS: MOCK TEST
    // ==========================================
    const fetchMockTest = async (companyName, roleName) => {
        setMockLoading(true);
        setMockError(null);
        try {
            const res = await fetch(
                `${API}/api/mentor/mock-test?company=${encodeURIComponent(companyName)}&role=${encodeURIComponent(roleName)}`
            );
            if (!res.ok) throw new Error("Failed to generate company mock test");
            const data = await res.json();
            setMockTestData(data);
            setSelectedAnswers({});
            setFlaggedQuestions({});
            setCurrentQuestionIndex(0);
            setTimeRemaining((data.timeLimitMinutes || 30) * 60);
            setTestState("ready");
            setTestScore(null);
            setCodeEvalResult(null);

            if (data.codingSection && data.codingSection.length > 0) {
                setActiveCodingProblemId(data.codingSection[0].id);
                setCandidateCode(data.codingSection[0].starterTemplates?.[codingLanguage] || "");
            }
        } catch (err) {
            setMockError(err.message);
        } finally {
            setMockLoading(false);
        }
    };

    const handleStartTest = () => {
        setTestState("in-progress");
        requestBrowserFullscreen();
    };

    const handleExitTest = () => {
        exitBrowserFullscreen();
        setTestState("ready");
        setShowExitConfirm(false);
    };

    const handleSelectOption = (questionId, optionIndex) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleToggleFlag = (questionId) => {
        setFlaggedQuestions((prev) => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleSubmitTest = () => {
        if (!mockTestData || !mockTestData.questions) return;
        let score = 0;
        const categoryBreakdown = {};

        mockTestData.questions.forEach((q) => {
            const cat = q.category || "General";
            if (!categoryBreakdown[cat]) {
                categoryBreakdown[cat] = { total: 0, correct: 0 };
            }
            categoryBreakdown[cat].total++;

            if (selectedAnswers[q.id] === q.correctIndex) {
                score++;
                categoryBreakdown[cat].correct++;
            }
        });

        // Save active code for current problem if in coding mode
        if (activeCodingProblemId && candidateCode) {
            userCodingSubmissions[activeCodingProblemId] = {
                ...(userCodingSubmissions[activeCodingProblemId] || {}),
                code: candidateCode,
                language: codingLanguage,
                evalResult: codeEvalResult
            };
        }

        const hasCoding = Boolean(mockTestData.codingSection && mockTestData.codingSection.length > 0);
        let codingPassedCount = 0;
        if (hasCoding) {
            mockTestData.codingSection.forEach(prob => {
                const sub = userCodingSubmissions[prob.id];
                if (sub?.evalResult?.allPassed || sub?.evalResult?.passed) {
                    codingPassedCount++;
                }
            });
        }

        const mcqTotal = mockTestData.questions.length;
        const mcqScore = score;
        const mcqPercentage = Math.round((mcqScore / mcqTotal) * 100);

        let finalPercentage = mcqPercentage;
        let overallPassed = mcqPercentage >= 60;

        if (hasCoding) {
            const codingTotal = mockTestData.codingSection.length;
            const codingPercentage = Math.round((codingPassedCount / codingTotal) * 100);
            finalPercentage = Math.round((mcqPercentage * 0.6) + (codingPercentage * 0.4));
            overallPassed = mcqPercentage >= 60 && codingPassedCount >= 1;
        }

        setTestScore({
            total: mcqTotal,
            score: mcqScore,
            percentage: finalPercentage,
            mcqPercentage,
            mcqScore,
            mcqTotal,
            passed: overallPassed,
            hasCoding,
            codingTotal: hasCoding ? mockTestData.codingSection.length : 0,
            codingPassedCount: hasCoding ? codingPassedCount : 0,
            categoryBreakdown
        });
        setTestState("completed");
        setReviewFilter("all");
        setReviewSubTab("mcq");
    };

    const handleSelectCodingProblem = (probId) => {
        // Save current problem code before switching
        if (activeCodingProblemId && candidateCode) {
            setUserCodingSubmissions(prev => ({
                ...prev,
                [activeCodingProblemId]: {
                    code: candidateCode,
                    language: codingLanguage,
                    evalResult: codeEvalResult
                }
            }));
        }

        setActiveCodingProblemId(probId);
        setActiveTestCaseIdx(0);
        setActiveConsoleTab("testcase");

        const saved = userCodingSubmissions[probId];
        if (saved && saved.code) {
            setCandidateCode(saved.code);
            if (saved.language) setCodingLanguage(saved.language);
            setCodeEvalResult(saved.evalResult || null);
        } else {
            setCodeEvalResult(null);
            const prob = mockTestData?.codingSection?.find(p => p.id === probId);
            if (prob && prob.starterTemplates && prob.starterTemplates[codingLanguage]) {
                setCandidateCode(prob.starterTemplates[codingLanguage]);
            }
        }
    };

    const handleCodingLanguageChange = (newLang) => {
        setCodingLanguage(newLang);
        setCodeEvalResult(null);
        const prob = mockTestData?.codingSection?.find(p => p.id === activeCodingProblemId) || mockTestData?.codingSection?.[0];
        if (prob && prob.starterTemplates && prob.starterTemplates[newLang]) {
            setCandidateCode(prob.starterTemplates[newLang]);
        }
    };

    const handleResetCode = () => {
        const prob = mockTestData?.codingSection?.find(p => p.id === activeCodingProblemId) || mockTestData?.codingSection?.[0];
        if (prob && prob.starterTemplates && prob.starterTemplates[codingLanguage]) {
            setCandidateCode(prob.starterTemplates[codingLanguage]);
            setCodeEvalResult(null);
        }
    };

    const handleRunCode = async () => {
        if (!candidateCode.trim()) {
            alert("Please write your solution code before running test cases.");
            return;
        }

        setCodeEvaluating(true);
        setRunMode("run");
        setActiveConsoleTab("result");

        const prob = mockTestData?.codingSection?.find(p => p.id === activeCodingProblemId) || mockTestData?.codingSection?.[0];
        try {
            const res = await fetch(`${API}/api/mentor/evaluate-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: selectedCompany,
                    role: targetRole,
                    problemId: activeCodingProblemId,
                    code: candidateCode,
                    language: codingLanguage,
                    mode: "run",
                    testCases: prob?.testCases || []
                })
            });

            if (!res.ok) throw new Error("Test runner execution failed");
            const result = await res.json();
            setCodeEvalResult(result);
            setUserCodingSubmissions(prev => ({
                ...prev,
                [activeCodingProblemId]: {
                    code: candidateCode,
                    language: codingLanguage,
                    evalResult: result
                }
            }));
        } catch (err) {
            alert("Code execution error: " + err.message);
        } finally {
            setCodeEvaluating(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!candidateCode.trim()) {
            alert("Please write your solution code before submitting.");
            return;
        }

        setCodeEvaluating(true);
        setRunMode("submit");
        setActiveConsoleTab("result");

        const prob = mockTestData?.codingSection?.find(p => p.id === activeCodingProblemId) || mockTestData?.codingSection?.[0];
        try {
            const res = await fetch(`${API}/api/mentor/evaluate-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: selectedCompany,
                    role: targetRole,
                    problemId: activeCodingProblemId,
                    code: candidateCode,
                    language: codingLanguage,
                    mode: "submit",
                    testCases: prob?.testCases || []
                })
            });

            if (!res.ok) throw new Error("Full test suite evaluation failed");
            const result = await res.json();
            setCodeEvalResult(result);
            setUserCodingSubmissions(prev => ({
                ...prev,
                [activeCodingProblemId]: {
                    code: candidateCode,
                    language: codingLanguage,
                    evalResult: result
                }
            }));
        } catch (err) {
            alert("Submission error: " + err.message);
        } finally {
            setCodeEvaluating(false);
        }
    };

    // ==========================================
    // API CALLS: AI VOICE INTERVIEWER
    // ==========================================
    const fetchInitialInterviewQuestion = async (comp, rle) => {
        setInterviewLoading(true);
        try {
            const res = await fetch(
                `${API}/api/mentor/interview-init?company=${encodeURIComponent(comp)}&role=${encodeURIComponent(rle)}`
            );
            if (res.ok) {
                const data = await res.json();
                setCurrentQuestion(data.question);
                if (autoReadQuestion && interviewRoomActive) {
                    speakQuestion(data.question);
                }
            }
        } catch (err) {
            setCurrentQuestion(
                `Welcome to ${comp}! Can you tell me about yourself, your core technical strengths, and what interests you about joining us as a ${rle}?`
            );
        } finally {
            setInterviewLoading(false);
        }
    };

    const handleStartInterviewRoom = () => {
        setInterviewRoomActive(true);
        requestBrowserFullscreen();
        if (!currentQuestion) {
            fetchInitialInterviewQuestion(interviewCompany, interviewRole);
        } else if (autoReadQuestion) {
            speakQuestion(currentQuestion);
        }
    };

    const handleExitInterviewRoom = () => {
        stopVoiceRecording();
        stopSpeaking();
        exitBrowserFullscreen();
        setInterviewRoomActive(false);
        setShowInterviewExitConfirm(false);
    };

    const handleEvaluateAnswer = async () => {
        if (!studentAnswerInput.trim()) return;
        setInterviewLoading(true);
        stopVoiceRecording();
        stopSpeaking();

        try {
            const res = await fetch(`${API}/api/mentor/interview-evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: interviewCompany,
                    role: interviewRole,
                    question: currentQuestion,
                    answer: studentAnswerInput,
                    history: interviewHistory
                })
            });
            if (!res.ok) throw new Error("Evaluation failed");
            const evalData = await res.json();

            setLatestEvaluation(evalData);
            setInterviewHistory((prev) => [
                ...prev,
                {
                    qNum: questionNumber,
                    question: currentQuestion,
                    answer: studentAnswerInput,
                    score: evalData.score,
                    evaluation: evalData
                }
            ]);
            setStudentAnswerInput("");
        } catch (err) {
            alert("Error evaluating response: " + err.message);
        } finally {
            setInterviewLoading(false);
        }
    };

    const handleNextInterviewQuestion = () => {
        if (latestEvaluation?.nextQuestion) {
            setCurrentQuestion(latestEvaluation.nextQuestion);
            setLatestEvaluation(null);
            setQuestionNumber((prev) => prev + 1);
            if (autoReadQuestion) {
                speakQuestion(latestEvaluation.nextQuestion);
            }
        }
    };

    // ==========================================
    // VOICE SPEECH RECOGNITION & SYNTHESIS
    // ==========================================
    const toggleVoiceRecording = () => {
        if (isListening) {
            stopVoiceRecording();
            return;
        }

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            setSpeechError("Microphone speech recognition is not supported in this browser. Please type your answer directly.");
            return;
        }

        setSpeechError(null);
        try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-IN";

            recognition.onstart = () => {
                setIsListening(true);
                stopSpeaking();
            };

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript + " ";
                }
                setStudentAnswerInput(transcript.trim());
            };

            recognition.onerror = (event) => {
                console.warn("Speech error:", event.error);
                if (event.error !== "no-speech") {
                    setSpeechError(`Microphone notice: ${event.error}. You can also type your answer.`);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Mic start error:", err);
            setSpeechError("Could not access microphone. Please verify browser permissions or type your answer.");
            setIsListening(false);
        }
    };

    const stopVoiceRecording = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore stop error
            }
        }
        setIsListening(false);
    };

    // Helper: Select friendly, natural female voice suited for comforting final-year students
    const getFriendlyFemaleVoice = () => {
        if (!("speechSynthesis" in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // 1. High Priority: Known warm, natural, female voices across Windows, Mac, Chrome, Edge
        const preferredFemale = voices.find((v) => {
            const name = (v.name || "").toLowerCase();
            const lang = (v.lang || "").toLowerCase();
            const isEnglish = lang.startsWith("en");
            if (!isEnglish) return false;

            // Filter out any male voice identifiers
            if (name.includes("david") || name.includes("george") || name.includes("mark") || name.includes("guy") || name.includes("male") || name.includes("richard") || name.includes("james") || name.includes("ravi") || name.includes("sean")) {
                return false;
            }

            // Match known friendly/comforting female voices
            return (
                name.includes("zira") ||
                name.includes("jenny") ||
                name.includes("aria") ||
                name.includes("samantha") ||
                name.includes("victoria") ||
                name.includes("karen") ||
                name.includes("veena") ||
                name.includes("neerja") ||
                name.includes("heera") ||
                name.includes("moira") ||
                name.includes("tessa") ||
                name.includes("female") ||
                name.includes("natural") ||
                (name.includes("google") && (lang === "en-in" || lang === "en-gb" || lang === "en-us"))
            );
        });

        if (preferredFemale) return preferredFemale;

        // 2. Any voice marked as female in English
        const anyFemale = voices.find((v) => {
            const name = (v.name || "").toLowerCase();
            const lang = (v.lang || "").toLowerCase();
            return lang.startsWith("en") && 
                (name.includes("female") || name.includes("woman")) && 
                !name.includes("male") && !name.includes("david");
        });
        if (anyFemale) return anyFemale;

        // 3. Indian English or British English voice without male indicators
        const enInOrGb = voices.find((v) => {
            const name = (v.name || "").toLowerCase();
            const lang = (v.lang || "").toLowerCase();
            return (lang === "en-in" || lang === "en-gb") && 
                !name.includes("david") && !name.includes("male") && !name.includes("ravi");
        });
        if (enInOrGb) return enInOrGb;

        // 4. Any English voice except David/male
        const nonMale = voices.find((v) => {
            const name = (v.name || "").toLowerCase();
            const lang = (v.lang || "").toLowerCase();
            return lang.startsWith("en") && !name.includes("david") && !name.includes("male");
        });

        return nonMale || voices[0] || null;
    };

    const speakQuestion = (text) => {
        if (!("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.94; // unhurried, natural comforting rate
        utterance.pitch = 1.08; // friendly, natural warm pitch
        const voice = getFriendlyFemaleVoice();
        if (voice) utterance.voice = voice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    // ==========================================
    // VOICE COMMUNICATION COACH LOGIC
    // ==========================================
    useEffect(() => {
        fetch(`${API}/api/mentor/voice-coach/topics`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.topics) {
                    setCoachTopicsData(data.topics);
                }
            })
            .catch(() => {});
    }, []);

    const handleSelectCoachTopic = (topicKey) => {
        setCoachTopic(topicKey);
        const topicObj = coachTopicsData ? coachTopicsData[topicKey] : null;
        if (topicObj) {
            setActiveCoachPrompt(topicObj.defaultPrompt || topicObj.prompts?.[0] || "");
        }
        setCoachTranscript("");
        setCoachEvaluation(null);
        setCoachSpeakingDuration(0);
        stopCoachRecording();
        stopCoachAudio();
    };

    const toggleCoachRecording = () => {
        if (isCoachListening) {
            stopCoachRecording();
            return;
        }

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            alert("Microphone speech recognition is not supported in this browser. Please type your speech directly into the practice box.");
            return;
        }

        stopCoachAudio();
        setCoachTranscript("");
        setCoachSpeakingDuration(0);

        try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-IN";

            recognition.onstart = () => {
                setIsCoachListening(true);
                if (coachTimerRef.current) clearInterval(coachTimerRef.current);
                coachTimerRef.current = setInterval(() => {
                    setCoachSpeakingDuration((prev) => prev + 1);
                }, 1000);
            };

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript + " ";
                }
                setCoachTranscript(transcript.trim());
            };

            recognition.onerror = (event) => {
                console.warn("Coach speech error:", event.error);
                setIsCoachListening(false);
                if (coachTimerRef.current) clearInterval(coachTimerRef.current);
            };

            recognition.onend = () => {
                setIsCoachListening(false);
                if (coachTimerRef.current) clearInterval(coachTimerRef.current);
            };

            coachRecognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Coach mic error:", err);
            setIsCoachListening(false);
            if (coachTimerRef.current) clearInterval(coachTimerRef.current);
        }
    };

    const stopCoachRecording = () => {
        if (coachRecognitionRef.current) {
            try {
                coachRecognitionRef.current.stop();
            } catch {
                // Ignore stop error
            }
        }
        setIsCoachListening(false);
        if (coachTimerRef.current) clearInterval(coachTimerRef.current);
    };

    const speakCoachMessage = (text) => {
        if (!("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.94; // warm, natural, soothing pace
        utterance.pitch = 1.08; // friendly, natural female tone

        const voice = getFriendlyFemaleVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setCoachAudioPlaying(true);
        utterance.onend = () => setCoachAudioPlaying(false);
        utterance.onerror = () => setCoachAudioPlaying(false);
        window.speechSynthesis.speak(utterance);
    };

    const stopCoachAudio = () => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setCoachAudioPlaying(false);
    };

    const handleEvaluateCoachSpeech = async () => {
        if (!coachTranscript.trim()) {
            alert("Please speak or type your answer before analyzing.");
            return;
        }

        setCoachLoading(true);
        stopCoachRecording();
        stopCoachAudio();

        try {
            const res = await fetch(`${API}/api/mentor/voice-coach/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: coachTopic,
                    prompt: activeCoachPrompt,
                    transcript: coachTranscript,
                    durationSeconds: coachSpeakingDuration || 25,
                    history: coachHistory
                })
            });

            if (!res.ok) throw new Error("Spoken speech evaluation failed");
            const data = await res.json();
            setCoachEvaluation(data);
            setCoachHistory((prev) => [
                {
                    topic: coachTopic,
                    prompt: activeCoachPrompt,
                    transcript: coachTranscript,
                    duration: coachSpeakingDuration || 25,
                    evaluation: data,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                },
                ...prev
            ]);

            if (autoReadQuestion && data.coachSpokenFeedback) {
                speakCoachMessage(data.coachSpokenFeedback);
            }
        } catch (err) {
            alert("Coach evaluation error: " + err.message);
        } finally {
            setCoachLoading(false);
        }
    };


    // ==========================================
    // API CALLS: PYQ VAULT & GOVT GUIDE
    // ==========================================
    const fetchCompanyPYQs = async (companyName, roleName) => {
        setPyqLoading(true);
        setPyqError(null);
        try {
            const res = await fetch(
                `${API}/api/mentor/pyq?company=${encodeURIComponent(companyName)}&role=${encodeURIComponent(roleName)}`
            );
            if (!res.ok) throw new Error("Failed to load company questions");
            const data = await res.json();
            setPyqData(data);
            setExpandedQuestionId(data.frequentQuestions?.[0]?.id || null);
        } catch (err) {
            setPyqError(err.message);
        } finally {
            setPyqLoading(false);
        }
    };

    const fetchGovtGuide = async (examKey) => {
        setGovtLoading(true);
        try {
            const res = await fetch(`${API}/api/mentor/govt-guide?exam=${examKey}`);
            const data = await res.json();
            setGovtData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setGovtLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "govt") {
            fetchGovtGuide(selectedGovtExam);
        }
    }, [activeTab, selectedGovtExam]);

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedAnswerId(id);
        setTimeout(() => setCopiedAnswerId(null), 2000);
    };

    // =========================================================================
    // RENDER: FULL-SCREEN PROCTORED ASSESSMENT ARENA (WHEN TEST IS IN PROGRESS)
    // =========================================================================
    if (testState === "in-progress" && mockTestData?.questions) {
        const activeQ = mockTestData.questions[currentQuestionIndex];
        const isAnswered = selectedAnswers[activeQ?.id] !== undefined;
        const answeredCount = Object.keys(selectedAnswers).length;

        return (
            <div className="fullscreen-proctored-arena">
                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="fullscreen-exit-modal-backdrop">
                        <div className="fullscreen-exit-dialog">
                            <h3>⚠️ Exit Assessment?</h3>
                            <p>
                                Are you sure you want to leave the exam arena? Your progress will be discarded. If you are finished, click "Finish & Submit" instead.
                            </p>
                            <div className="exit-dialog-actions">
                                <button className="arena-btn-secondary" onClick={() => setShowExitConfirm(false)}>
                                    Continue Exam
                                </button>
                                <button className="arena-btn-exit" onClick={handleExitTest}>
                                    Confirm Exit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Proctor Bar */}
                <header className="arena-top-proctor-bar">
                    <div className="arena-left-meta">
                        <div className="proctor-live-indicator">
                            <span className="proctor-dot"></span>
                            <span>Proctored Assessment</span>
                        </div>
                        <div className="arena-title-text">
                            <h2>{mockTestData.company} Placement Assessment</h2>
                            <span>
                                Target: {targetRole} • {mockTestData.questions.length} Objective Qs
                                {mockTestData.codingSection && mockTestData.codingSection.length > 0 ? ` + ${mockTestData.codingSection.length} Live Coding Challenges` : ""}
                            </span>
                        </div>
                    </div>

                    <div className={`arena-center-timer ${timeRemaining < 300 ? "urgent" : ""}`}>
                        <span>⏳</span>
                        <span>Time Remaining:</span>
                        <strong className="arena-timer-digits">{formatTimer(timeRemaining)}</strong>
                    </div>

                    <div className="arena-right-controls">
                        <div className="arena-answered-chip">
                            Answered: <strong>{answeredCount}</strong> / {mockTestData.questions.length}
                        </div>
                        <button
                            type="button"
                            className="arena-btn-control"
                            onClick={toggleFullscreenMode}
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            <span>{isFullscreen ? "🗗" : "⛶"}</span>
                            <span>{isFullscreen ? "Standard" : "Full Screen"}</span>
                        </button>
                        <button
                            type="button"
                            className="arena-btn-control arena-btn-exit"
                            onClick={() => setShowExitConfirm(true)}
                        >
                            ✕ Exit
                        </button>
                        <button
                            type="button"
                            className="arena-btn-finish"
                            onClick={handleSubmitTest}
                        >
                            ✓ Finish & Submit Test
                        </button>
                    </div>
                </header>

                {/* Main Split Stage */}
                <div className={`arena-stage-split ${mockSubTab === "coding" ? "coding-mode" : ""}`}>
                    {/* Left Question Center */}
                    <main className="arena-question-stage">
                        {/* Subtabs if Coding Section present */}
                        {mockTestData.codingSection && mockTestData.codingSection.length > 0 && (
                            <div className="arena-subtab-bar">
                                <button
                                    className={`arena-subtab-btn ${mockSubTab === "mcq" ? "active" : ""}`}
                                    onClick={() => setMockSubTab("mcq")}
                                >
                                    <span>📝 Objective Assessment ({mockTestData.questions.length} Questions)</span>
                                </button>
                                <button
                                    className={`arena-subtab-btn ${mockSubTab === "coding" ? "active" : ""}`}
                                    onClick={() => setMockSubTab("coding")}
                                >
                                    <span>💻 Live Coding Arena ({mockTestData.codingSection.length} Challenges)</span>
                                </button>
                            </div>
                        )}

                        {mockSubTab === "mcq" && activeQ && (
                            <div className="arena-card-box">
                                <div className="arena-q-header-row">
                                    <div className="arena-q-meta-tags">
                                        <span className="arena-q-number-badge">Question {currentQuestionIndex + 1} of {mockTestData.questions.length}</span>
                                        <span className="arena-q-category-pill">{activeQ.category}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`arena-btn-flag ${flaggedQuestions[activeQ.id] ? "flagged" : ""}`}
                                        onClick={() => handleToggleFlag(activeQ.id)}
                                    >
                                        <span>🚩</span>
                                        <span>{flaggedQuestions[activeQ.id] ? "Flagged for Review" : "Flag Question"}</span>
                                    </button>
                                </div>

                                <h3 className="arena-q-text">{activeQ.question}</h3>

                                <div className="arena-options-container">
                                    {activeQ.options.map((opt, optIdx) => {
                                        const isSelected = selectedAnswers[activeQ.id] === optIdx;
                                        return (
                                            <button
                                                key={optIdx}
                                                type="button"
                                                className={`arena-option-card ${isSelected ? "selected" : ""}`}
                                                onClick={() => handleSelectOption(activeQ.id, optIdx)}
                                            >
                                                <span className="arena-opt-radio">
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="arena-opt-label">{opt}</span>
                                                {isSelected && <span className="arena-opt-check">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="arena-nav-bottom-bar">
                                    <button
                                        className="arena-btn-secondary"
                                        disabled={currentQuestionIndex === 0}
                                        onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                                    >
                                        ← Previous Question
                                    </button>

                                    {isAnswered && (
                                        <button
                                            className="arena-btn-secondary"
                                            onClick={() => {
                                                const nextAns = { ...selectedAnswers };
                                                delete nextAns[activeQ.id];
                                                setSelectedAnswers(nextAns);
                                            }}
                                        >
                                            Clear Selection
                                        </button>
                                    )}

                                    {currentQuestionIndex < mockTestData.questions.length - 1 ? (
                                        <button
                                            className="arena-btn-primary"
                                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                        >
                                            Next Question →
                                        </button>
                                    ) : mockTestData.codingSection && mockTestData.codingSection.length > 0 ? (
                                        <button
                                            className="arena-btn-primary"
                                            onClick={() => setMockSubTab("coding")}
                                            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                                        >
                                            Proceed to Live Coding Arena 💻 →
                                        </button>
                                    ) : (
                                        <button
                                            className="arena-btn-finish"
                                            onClick={handleSubmitTest}
                                        >
                                            ✓ Submit Assessment
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {mockSubTab === "coding" && mockTestData.codingSection && (
                            <div className="leetcode-arena-container">
                                {/* Problem Switcher Tabs Bar */}
                                <div className="leetcode-problem-tabs-bar">
                                    <div className="leetcode-prob-pills">
                                        {mockTestData.codingSection.map((prob, pIdx) => (
                                            <button
                                                key={prob.id}
                                                type="button"
                                                className={`leetcode-prob-tab ${activeCodingProblemId === prob.id ? "active" : ""}`}
                                                onClick={() => handleSelectCodingProblem(prob.id)}
                                            >
                                                <span className="prob-tab-num">Problem {pIdx + 1}</span>
                                                <span className="prob-tab-title">{prob.title}</span>
                                                <span className={`prob-diff-tag ${prob.difficulty?.toLowerCase()}`}>{prob.difficulty}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="leetcode-company-badge">
                                        <span>🏢 {mockTestData.company} Algorithmic Round</span>
                                    </div>
                                </div>

                                {(() => {
                                    const prob = mockTestData.codingSection.find((p) => p.id === activeCodingProblemId) || mockTestData.codingSection[0];
                                    const testCases = prob.testCases && prob.testCases.length > 0 ? prob.testCases : [
                                        { id: 1, name: "Case 1", input: prob.sampleInput || "sample", expectedOutput: prob.sampleOutput || "0" }
                                    ];
                                    const linesCount = (candidateCode || "").split("\n").length;
                                    const lineNumbers = Array.from({ length: Math.max(linesCount, 16) }, (_, i) => i + 1);

                                    return (
                                        <div className="leetcode-split-ide">
                                            {/* LEFT PANEL: Problem Description, Examples & Constraints */}
                                            <div className="leetcode-left-panel">
                                                <div className="leetcode-panel-header">
                                                    <div className="problem-title-row">
                                                        <h3 className="problem-main-title">{prob.title}</h3>
                                                        <div className="problem-meta-chips">
                                                            <span className={`diff-chip ${prob.difficulty?.toLowerCase()}`}>
                                                                {prob.difficulty}
                                                            </span>
                                                            {prob.acceptanceRate && (
                                                                <span className="acceptance-chip">
                                                                    Acceptance: <strong>{prob.acceptanceRate}</strong>
                                                                </span>
                                                            )}
                                                            {prob.topicTags && prob.topicTags.map((tag, tIdx) => (
                                                                <span key={tIdx} className="topic-chip">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="leetcode-panel-scroll">
                                                    {/* Problem Statement */}
                                                    <div className="leetcode-statement-box">
                                                        <p className="statement-text">{formatLatexClean(prob.problemStatement)}</p>
                                                    </div>

                                                    {/* Examples */}
                                                    {prob.examples && prob.examples.length > 0 ? (
                                                        <div className="leetcode-examples-wrap">
                                                            {prob.examples.map((ex, exIdx) => (
                                                                <div key={exIdx} className="leetcode-example-card">
                                                                    <div className="example-header-label">
                                                                        Example {ex.exampleNumber || exIdx + 1}:
                                                                    </div>
                                                                    <div className="example-io-block">
                                                                        <div className="io-row">
                                                                            <span className="io-lbl">Input:</span>
                                                                            <code className="io-code">{formatLatexClean(ex.input)}</code>
                                                                        </div>
                                                                        <div className="io-row">
                                                                            <span className="io-lbl">Output:</span>
                                                                            <code className="io-code">{formatLatexClean(ex.output)}</code>
                                                                        </div>
                                                                        {ex.explanation && (
                                                                            <div className="io-row">
                                                                                <span className="io-lbl">Explanation:</span>
                                                                                <span className="io-explanation">{formatLatexClean(ex.explanation)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="leetcode-example-card">
                                                            <div className="example-header-label">Example 1:</div>
                                                            <div className="example-io-block">
                                                                <div className="io-row">
                                                                    <span className="io-lbl">Input:</span>
                                                                    <code className="io-code">{formatLatexClean(prob.sampleInput)}</code>
                                                                </div>
                                                                <div className="io-row">
                                                                    <span className="io-lbl">Output:</span>
                                                                    <code className="io-code">{formatLatexClean(prob.sampleOutput)}</code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Constraints */}
                                                    {prob.constraints && prob.constraints.length > 0 && (
                                                        <div className="leetcode-constraints-box">
                                                            <h4 className="constraints-header">Constraints:</h4>
                                                            <ul className="constraints-list">
                                                                {prob.constraints.map((c, cIdx) => (
                                                                    <li key={cIdx}>
                                                                        <code>{formatLatexClean(c)}</code>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT PANEL: Code Editor & Interactive Testcase Console */}
                                            <div className="leetcode-right-panel">
                                                {/* Editor Toolbar */}
                                                <div className="editor-top-toolbar">
                                                    <div className="editor-lang-wrap">
                                                        <span className="lang-icon">⚡</span>
                                                        <select
                                                            className="editor-lang-select"
                                                            value={codingLanguage}
                                                            onChange={(e) => handleCodingLanguageChange(e.target.value)}
                                                        >
                                                            <option value="javascript">JavaScript (Node.js)</option>
                                                            <option value="python">Python 3</option>
                                                            <option value="java">Java 17</option>
                                                            <option value="cpp">C++ (GCC)</option>
                                                        </select>
                                                    </div>
                                                    <div className="editor-top-actions">
                                                        <button
                                                            type="button"
                                                            className="editor-btn-action"
                                                            onClick={handleResetCode}
                                                            title="Reset to starter boilerplate"
                                                        >
                                                            <span>↺</span>
                                                            <span>Reset</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-run-code"
                                                            onClick={handleRunCode}
                                                            disabled={codeEvaluating}
                                                            title="Run solution against sample testcases"
                                                        >
                                                            <span>▶</span>
                                                            <span>Run Code</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-submit-code"
                                                            onClick={handleSubmitCode}
                                                            disabled={codeEvaluating}
                                                            title="Submit solution to company test suite"
                                                        >
                                                            <span>🚀</span>
                                                            <span>Submit Solution</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Monospace Code Editor Area with Line Numbers */}
                                                <div className="leetcode-editor-workspace">
                                                    <div className="editor-gutter">
                                                        {lineNumbers.map((n) => (
                                                            <span key={n} className="gutter-line">{n}</span>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        className="leetcode-code-input"
                                                        value={candidateCode}
                                                        onChange={(e) => setCandidateCode(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Tab") {
                                                                e.preventDefault();
                                                                const start = e.target.selectionStart;
                                                                const end = e.target.selectionEnd;
                                                                setCandidateCode(
                                                                    candidateCode.substring(0, start) + "    " + candidateCode.substring(end)
                                                                );
                                                                setTimeout(() => {
                                                                    e.target.selectionStart = e.target.selectionEnd = start + 4;
                                                                }, 0);
                                                            }
                                                        }}
                                                        placeholder="// Write your solution here..."
                                                        spellCheck={false}
                                                    />
                                                </div>

                                                {/* LeetCode Bottom Interactive Console */}
                                                <div className="leetcode-interactive-console">
                                                    <div className="console-tabs-bar">
                                                        <button
                                                            type="button"
                                                            className={`console-tab-btn ${activeConsoleTab === "testcase" ? "active" : ""}`}
                                                            onClick={() => setActiveConsoleTab("testcase")}
                                                        >
                                                            <span>▶ Testcase</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`console-tab-btn ${activeConsoleTab === "result" ? "active" : ""}`}
                                                            onClick={() => setActiveConsoleTab("result")}
                                                        >
                                                            <span>📊 Test Result</span>
                                                            {codeEvalResult && (
                                                                <span className={`console-status-dot ${codeEvalResult.passed ? "pass" : "fail"}`}></span>
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="console-panel-body">
                                                        {activeConsoleTab === "testcase" && (
                                                            <div className="testcase-tab-view">
                                                                {/* Case Pills Selector */}
                                                                <div className="case-pills-row">
                                                                    {testCases.map((tc, idx) => (
                                                                        <button
                                                                            key={tc.id || idx}
                                                                            type="button"
                                                                            className={`case-pill-btn ${activeTestCaseIdx === idx ? "active" : ""}`}
                                                                            onClick={() => setActiveTestCaseIdx(idx)}
                                                                        >
                                                                            {tc.name || `Case ${idx + 1}`}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                {/* Case Input & Output Cards */}
                                                                {(() => {
                                                                    const currentTc = testCases[activeTestCaseIdx] || testCases[0];
                                                                    return (
                                                                        <div className="case-io-details">
                                                                            <div className="case-field-block">
                                                                                <span className="case-field-title">Input Parameters</span>
                                                                                <div className="case-field-value">
                                                                                    <code>{formatLatexClean(currentTc.input)}</code>
                                                                                </div>
                                                                            </div>
                                                                            <div className="case-field-block">
                                                                                <span className="case-field-title">Expected Output</span>
                                                                                <div className="case-field-value">
                                                                                    <code>{formatLatexClean(currentTc.expectedOutput)}</code>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                        {activeConsoleTab === "result" && (
                                                            <div className="result-tab-view">
                                                                {codeEvaluating && (
                                                                    <div className="console-loading-state">
                                                                        <div className="spinner"></div>
                                                                        <p>{runMode === "run" ? "Simulating execution against test cases..." : `Running solution through ${mockTestData.company} full test suite...`}</p>
                                                                    </div>
                                                                )}

                                                                {!codeEvaluating && !codeEvalResult && (
                                                                    <div className="console-empty-state">
                                                                        <p>Click <strong>▶ Run Code</strong> to test sample cases or <strong>🚀 Submit Solution</strong> to evaluate complexity & placement criteria.</p>
                                                                    </div>
                                                                )}

                                                                {!codeEvaluating && codeEvalResult && (
                                                                    <div className="console-results-details">
                                                                        {/* Verdict Banner */}
                                                                        <div className={`verdict-banner ${codeEvalResult.passed || codeEvalResult.verdict === "Accepted" ? "accepted" : "failed"}`}>
                                                                            <div className="verdict-headline">
                                                                                <span className="verdict-title-text">
                                                                                    {codeEvalResult.verdict || (codeEvalResult.passed ? "Accepted" : "Wrong Answer")}
                                                                                </span>
                                                                                {codeEvalResult.score !== undefined && (
                                                                                    <span className="verdict-score-pill">Score: {codeEvalResult.score} / 100</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="verdict-metrics-row">
                                                                                <span>Runtime: <strong>{codeEvalResult.runtimeMs || 48} ms</strong></span>
                                                                                {codeEvalResult.runtimeBeatsPercentile && (
                                                                                    <span className="beats-tag">(Beats {codeEvalResult.runtimeBeatsPercentile})</span>
                                                                                )}
                                                                                <span className="metric-sep">•</span>
                                                                                <span>Memory: <strong>{codeEvalResult.memoryKb || "41.8 MB"}</strong></span>
                                                                                <span className="metric-sep">•</span>
                                                                                <span>Complexity: <strong>{codeEvalResult.timeComplexity || "O(N)"}</strong>, <strong>{codeEvalResult.spaceComplexity || "O(1)"}</strong></span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Testcases Evaluated Pills */}
                                                                        {codeEvalResult.testcaseResults && codeEvalResult.testcaseResults.length > 0 && (
                                                                            <div className="result-cases-wrapper">
                                                                                <div className="case-pills-row">
                                                                                    {codeEvalResult.testcaseResults.map((tr, idx) => (
                                                                                        <button
                                                                                            key={tr.caseId || idx}
                                                                                            type="button"
                                                                                            className={`case-pill-btn ${activeTestCaseIdx === idx ? "active" : ""} ${tr.passed ? "pass" : "fail"}`}
                                                                                            onClick={() => setActiveTestCaseIdx(idx)}
                                                                                        >
                                                                                            <span>{tr.passed ? "✓" : "✗"}</span>
                                                                                            <span>{tr.name || `Case ${idx + 1}`}</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>

                                                                                {(() => {
                                                                                    const activeTr = codeEvalResult.testcaseResults[activeTestCaseIdx] || codeEvalResult.testcaseResults[0];
                                                                                    return (
                                                                                        <div className="case-io-details">
                                                                                            <div className="case-field-block">
                                                                                                <span className="case-field-title">Input</span>
                                                                                                <div className="case-field-value">
                                                                                                    <code>{formatLatexClean(activeTr.input)}</code>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="case-field-block">
                                                                                                <span className="case-field-title">Output</span>
                                                                                                <div className={`case-field-value ${activeTr.passed ? "output-pass" : "output-fail"}`}>
                                                                                                    <code>{formatLatexClean(activeTr.actualOutput)}</code>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="case-field-block">
                                                                                                <span className="case-field-title">Expected</span>
                                                                                                <div className="case-field-value">
                                                                                                    <code>{formatLatexClean(activeTr.expectedOutput)}</code>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}

                                                                        {/* Recruiter Placement Tip */}
                                                                        {codeEvalResult.mentorTip && (
                                                                            <div className="console-recruiter-tip-box">
                                                                                <strong>💡 Placement Mentor Tip for {mockTestData.company}:</strong>
                                                                                <p>{codeEvalResult.mentorTip}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Console Action Bar */}
                                                    <div className="console-action-footer">
                                                        <div className="console-footer-left">
                                                            <span className="console-status-hint">
                                                                {mockTestData.company} Placement Code Evaluator
                                                            </span>
                                                        </div>
                                                        <div className="console-footer-right">
                                                            <button
                                                                type="button"
                                                                className="btn-run-code"
                                                                onClick={handleRunCode}
                                                                disabled={codeEvaluating}
                                                            >
                                                                <span>▶</span>
                                                                <span>Run Code</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-submit-code"
                                                                onClick={handleSubmitCode}
                                                                disabled={codeEvaluating}
                                                            >
                                                                <span>🚀</span>
                                                                <span>Submit Solution</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </main>

                    {/* Right Question Palette Sidebar (MCQ Mode only) */}
                    {mockSubTab === "mcq" && (
                        <aside className="arena-sidebar-palette">
                            <div className="arena-palette-title-row">
                                <h4 className="arena-palette-title">Question Palette</h4>
                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{mockTestData.questions.length} Total</span>
                            </div>

                            <div className="arena-palette-legend">
                                <div className="legend-item"><span className="legend-box answered"></span><span>Answered</span></div>
                                <div className="legend-item"><span className="legend-box current"></span><span>Current</span></div>
                                <div className="legend-item"><span className="legend-box flagged"></span><span>Flagged</span></div>
                                <div className="legend-item"><span className="legend-box unvisited"></span><span>Unvisited</span></div>
                            </div>

                            <div className="arena-palette-grid">
                                {mockTestData.questions.map((q, idx) => {
                                    const isCur = idx === currentQuestionIndex;
                                    const isAns = selectedAnswers[q.id] !== undefined;
                                    const isFlg = flaggedQuestions[q.id];

                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            className={`arena-palette-btn ${isCur ? "current" : ""} ${isAns ? "answered" : ""} ${isFlg ? "flagged" : ""}`}
                                            onClick={() => {
                                                setMockSubTab("mcq");
                                                setCurrentQuestionIndex(idx);
                                            }}
                                            title={`Question ${idx + 1}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {mockTestData.codingSection && mockTestData.codingSection.length > 0 && (
                                <div style={{ marginTop: "18px", padding: "14px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.35)", borderRadius: "10px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#818cf8", marginBottom: "4px" }}>
                                        💻 Live Coding Round Included
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px", lineHeight: "1.4" }}>
                                        {mockTestData.codingSection.length} challenges configured for {mockTestData.company}.
                                    </div>
                                    <button
                                        type="button"
                                        className="arena-btn-primary"
                                        style={{ width: "100%", padding: "8px 12px", fontSize: "12px", borderRadius: "6px", background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                                        onClick={() => setMockSubTab("coding")}
                                    >
                                        Open Coding Arena 💻
                                    </button>
                                </div>
                            )}
                        </aside>
                    )}
                </div>
            </div>
        );
    }

    // =========================================================================
    // RENDER: FULL-SCREEN VIRTUAL AI INTERVIEW SUITE (WHEN INTERVIEW IS ACTIVE)
    // =========================================================================
    if (interviewRoomActive) {
        return (
            <div className="fullscreen-interview-suite">
                {/* Exit Confirmation Dialog */}
                {showInterviewExitConfirm && (
                    <div className="fullscreen-exit-modal-backdrop">
                        <div className="fullscreen-exit-dialog">
                            <h3>⚠️ Exit Interview Room?</h3>
                            <p>
                                Are you sure you want to end your simulated interview session with {interviewCompany}?
                            </p>
                            <div className="exit-dialog-actions">
                                <button className="arena-btn-secondary" onClick={() => setShowInterviewExitConfirm(false)}>
                                    Continue Interview
                                </button>
                                <button className="arena-btn-exit" onClick={handleExitInterviewRoom}>
                                    Confirm Exit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Bar */}
                <header className="interview-suite-topbar">
                    <div className="interview-top-meta">
                        <div className="interview-live-chip">
                            <span className="interview-live-pulse"></span>
                            <span>Live Virtual Interview</span>
                        </div>
                        <div className="arena-title-text">
                            <h2>{interviewCompany} • Technical Placement Round</h2>
                            <span>Target Role: {interviewRole} • Question #{questionNumber}</span>
                        </div>
                    </div>

                    <div className="arena-right-controls">
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#cbd5e1", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={autoReadQuestion}
                                onChange={(e) => setAutoReadQuestion(e.target.checked)}
                            />
                            <span>Auto-Voice AI</span>
                        </label>

                        <button
                            type="button"
                            className="arena-btn-control"
                            onClick={toggleFullscreenMode}
                        >
                            <span>{isFullscreen ? "🗗" : "⛶"}</span>
                            <span>{isFullscreen ? "Standard" : "Full Screen"}</span>
                        </button>

                        <button
                            type="button"
                            className="arena-btn-control arena-btn-exit"
                            onClick={() => setShowInterviewExitConfirm(true)}
                        >
                            ✕ End Interview
                        </button>
                    </div>
                </header>

                {/* Main Virtual Interview Stage */}
                <div className="interview-stage-container">
                    {/* Left: The Interviewer Booth */}
                    <div className="interview-booth-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#818cf8", textTransform: "uppercase" }}>
                                Lead Technical Recruiter • {interviewCompany}
                            </span>
                            <button
                                type="button"
                                className="arena-btn-secondary"
                                style={{ padding: "4px 10px", fontSize: "12px" }}
                                onClick={() => (isSpeaking ? stopSpeaking() : speakQuestion(currentQuestion))}
                            >
                                {isSpeaking ? "⏹️ Stop Speech" : "🔊 Replay Question"}
                            </button>
                        </div>

                        <div className="interviewer-display-box">
                            <div className="interviewer-avatar-circle">
                                👔
                            </div>
                            {isSpeaking && (
                                <div className="interviewer-speaking-waves">
                                    <span></span><span></span><span></span><span></span><span></span>
                                </div>
                            )}
                            <h4 style={{ margin: "0", color: "#f8fafc", fontSize: "16px" }}>Senior Technical Evaluator</h4>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{interviewCompany} Campus Hiring Panel</span>
                        </div>

                        <div className="question-bubble-large">
                            {currentQuestion || "Formulating role-specific interview question..."}
                        </div>
                    </div>

                    {/* Right: The Candidate Station */}
                    <div className="interview-booth-card">
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#10b981", textTransform: "uppercase" }}>
                            Candidate Answer Stage (You)
                        </span>

                        <div className="candidate-mic-station">
                            <button
                                type="button"
                                className={`btn-candidate-mic-large ${isListening ? "recording" : ""}`}
                                onClick={toggleVoiceRecording}
                                title={isListening ? "Stop Recording" : "Click to speak your answer"}
                            >
                                🎙️
                            </button>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: isListening ? "#f87171" : "#94a3b8" }}>
                                {isListening ? "● Listening... Speak your answer naturally" : "Click microphone to dictate, or type below"}
                            </span>
                        </div>

                        {speechError && (
                            <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "10px", borderRadius: "8px", fontSize: "12px" }}>
                                ⚠️ {speechError}
                            </div>
                        )}

                        <textarea
                            className="candidate-answer-input-box"
                            rows={4}
                            placeholder="Your transcribed or typed answer will appear here..."
                            value={studentAnswerInput}
                            onChange={(e) => setStudentAnswerInput(e.target.value)}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                            <button
                                type="button"
                                className="arena-btn-secondary"
                                onClick={() => setStudentAnswerInput("")}
                                disabled={!studentAnswerInput || interviewLoading}
                            >
                                Clear Text
                            </button>
                            <button
                                type="button"
                                className="arena-btn-primary"
                                onClick={handleEvaluateAnswer}
                                disabled={!studentAnswerInput.trim() || interviewLoading}
                            >
                                {interviewLoading ? "Evaluating with AI..." : "🚀 Submit Answer for Recruiter Review"}
                            </button>
                        </div>

                        {/* Real-time Turn Feedback & Model Answer */}
                        {latestEvaluation && (
                            <div className="interview-eval-card">
                                <div className="eval-score-header">
                                    <span className="eval-score-pill">Score: {latestEvaluation.score} / 10</span>
                                    <span className={`eval-rating-badge ${latestEvaluation.score >= 7 ? "strong" : "needs-improvement"}`}>
                                        {latestEvaluation.rating || (latestEvaluation.score >= 7 ? "Strong Answer" : "Needs Review")}
                                    </span>
                                </div>

                                {latestEvaluation.strengths && latestEvaluation.strengths.length > 0 && (
                                    <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                                        <strong style={{ color: "#34d399" }}>✅ Strengths:</strong>
                                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                                            {latestEvaluation.strengths.map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {latestEvaluation.improvements && latestEvaluation.improvements.length > 0 && (
                                    <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                                        <strong style={{ color: "#f87171" }}>⚠️ Improvement Areas:</strong>
                                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                                            {latestEvaluation.improvements.map((im, idx) => (
                                                <li key={idx}>{im}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {latestEvaluation.modelAnswer && (
                                    <div className="gold-model-answer">
                                        <strong>💡 Gold Standard Model Answer for {interviewCompany}:</strong>
                                        {latestEvaluation.modelAnswer}
                                    </div>
                                )}

                                {latestEvaluation.nextQuestion && (
                                    <button
                                        type="button"
                                        className="arena-btn-finish"
                                        style={{ marginTop: "10px", width: "100%" }}
                                        onClick={handleNextInterviewQuestion}
                                    >
                                        Next Question ➔
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // RENDER: STANDARD WORKSPACE VIEW (TABS & SETUP CONTROLS)
    // =========================================================================
    return (
        <div className="career-mentor-wrapper">

            {/* ==============================================================
                TAB 1: COMPANY MOCK TESTS (FULL-SCREEN CAPABLE ARENA)
                ============================================================== */}
            {activeTab === "mock-test" && (
                <div className="mentor-content-pane">
                    {/* Control Card (Target ANY Company) */}
                    <div className="mentor-control-card">
                        <div className="control-card-header">
                            <div className="control-header-left">
                                <div className="control-icon-badge">🎯</div>
                                <div>
                                    <h3 className="control-title">Company Placement Test Simulator</h3>
                                    <p className="control-desc">
                                        Search or type <strong>ANY company across India</strong> (MSMEs, core manufacturing plants, IT giants, or startups) to generate an authentic placement exam matching their exact previous pattern and syllabus.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-generate-exam"
                                onClick={() => fetchMockTest(selectedCompany, targetRole)}
                                disabled={mockLoading}
                            >
                                <span>{mockLoading ? "Architecting Exam Pattern..." : "🚀 Generate Company Exam"}</span>
                            </button>
                        </div>

                        {/* Quick Selection Chips (Neutral, NO Tiers or Size Categorization) */}
                        <div className="company-pills-row">
                            <div className="pills-label-wrap">
                                <span className="pills-label">⚡ Quick Select:</span>
                            </div>
                            <div className="pills-scroll-container">
                                {popularCompanyChips.map((chipName) => {
                                    const isSelected = selectedCompany.toLowerCase() === chipName.toLowerCase();
                                    return (
                                        <button
                                            key={chipName}
                                            type="button"
                                            className={`company-pill-btn ${isSelected ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedCompany(chipName);
                                                setCustomCompanyInput(chipName);
                                                fetchMockTest(chipName, targetRole);
                                            }}
                                        >
                                            <span className="pill-name">{chipName}</span>
                                            {isSelected && <span className="pill-check-indicator">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search & Role Inputs Grid */}
                        <div className="mentor-search-inputs-grid">
                            <div className="mentor-input-block">
                                <label className="input-field-label">
                                    <span>🏢 Target Company / Recruiter</span>
                                    <span className="label-helper-hint">Type ANY company across India</span>
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-prefix-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="mentor-text-input"
                                        placeholder="Search or enter ANY company (e.g. HashAgile, Zoho, TCS, Texmo, Pricol, Roots...)"
                                        value={customCompanyInput || selectedCompany}
                                        onChange={(e) => {
                                            setCustomCompanyInput(e.target.value);
                                            setSelectedCompany(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mentor-input-block">
                                <label className="input-field-label">
                                    <span>💼 Target Job Role</span>
                                    <span className="label-helper-hint">Engineering, Tech, or Operations</span>
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-prefix-icon">🎯</span>
                                    <input
                                        type="text"
                                        className="mentor-text-input"
                                        placeholder="e.g. Software Development Engineer, Frontend, Core Mechanical..."
                                        value={customRoleInput || targetRole}
                                        onChange={(e) => {
                                            setCustomRoleInput(e.target.value);
                                            setTargetRole(e.target.value);
                                        }}
                                        list="roles-datalist"
                                    />
                                    <datalist id="roles-datalist">
                                        {popularRoles.map((r) => (
                                            <option key={r} value={r} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    </div>

                    {mockLoading && (
                        <div className="loading-card">
                            <div className="spinner"></div>
                            <p>Architecting authentic placement assessment for {selectedCompany} ({targetRole})...</p>
                        </div>
                    )}

                    {mockError && (
                        <div className="alert-card alert-error">
                            <p>⚠️ {mockError}</p>
                            <button className="btn btn-secondary" onClick={() => fetchMockTest(selectedCompany, targetRole)}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {mockTestData && !mockLoading && (
                        <div>
                            {/* Ready State: Launch Assessment */}
                            {testState === "ready" && (
                                <div className="test-ready-card">
                                    <div className="ready-badge">Assessment Ready</div>
                                    <h2 className="ready-title">{mockTestData.testTitle}</h2>
                                    <p className="ready-desc">
                                        {mockTestData.patternSummary || `Authentic placement assessment for ${mockTestData.company} (${targetRole}). Designed based on previous campus recruitment rounds.`}
                                    </p>

                                    {mockTestData.codingRationale && (
                                        <div style={{ margin: "14px 0", padding: "12px 16px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "8px", fontSize: "13px", color: "#c7d2fe", textAlign: "left", lineHeight: "1.5" }}>
                                            <strong style={{ color: "#a5b4fc" }}>💡 Exam Format Discovery:</strong> {mockTestData.codingRationale}
                                            {mockTestData.hasCodingRound ? (
                                                <span style={{ display: "block", marginTop: "4px", color: "#34d399", fontWeight: "600" }}>
                                                    ✓ Includes Live LeetCode Coding Arena ({mockTestData.codingSection?.length || 2} Algorithmic Challenges)
                                                </span>
                                            ) : (
                                                <span style={{ display: "block", marginTop: "4px", color: "#facc15", fontWeight: "600" }}>
                                                    ✓ Non-Coding Domain Assessment (Zero programming rounds required for this position)
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="test-meta-grid">
                                        <div className="meta-box">
                                            <span className="meta-val">{mockTestData.totalQuestions || mockTestData.questions?.length}</span>
                                            <span className="meta-lbl">Total Questions</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-val">{mockTestData.timeLimitMinutes || 45} Mins</span>
                                            <span className="meta-lbl">Time Limit</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-val">60%</span>
                                            <span className="meta-lbl">Passing Score</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-val">No Penalty</span>
                                            <span className="meta-lbl">Negative Marking</span>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary btn-large" onClick={handleStartTest}>
                                        <span>🚀 Start Assessment ({mockTestData.totalQuestions || mockTestData.questions?.length} Qs • Full-Screen Mode)</span>
                                    </button>
                                </div>
                            )}

                            {/* Completed State: Review & Explanations */}
                            {testState === "completed" && testScore && (() => {
                                const mcqQuestions = mockTestData.questions || [];
                                const correctCount = mcqQuestions.filter(q => selectedAnswers[q.id] === q.correctIndex).length;
                                const incorrectCount = mcqQuestions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctIndex).length;
                                const skippedCount = mcqQuestions.filter(q => selectedAnswers[q.id] === undefined).length;

                                const filteredQuestions = mcqQuestions.filter(q => {
                                    const userChoice = selectedAnswers[q.id];
                                    if (reviewFilter === "correct") return userChoice === q.correctIndex;
                                    if (reviewFilter === "incorrect") return userChoice !== undefined && userChoice !== q.correctIndex;
                                    if (reviewFilter === "skipped") return userChoice === undefined;
                                    return true;
                                });

                                return (
                                    <div className="test-results-panel">
                                        {/* Composite Scorecard Banner */}
                                        <div className="composite-scorecard-panel">
                                            <div className={`composite-verdict-banner ${testScore.passed ? "verdict-pass" : "verdict-fail"}`}>
                                                <div className="verdict-icon">
                                                    {testScore.passed ? "🏆" : "📈"}
                                                </div>
                                                <div className="verdict-text">
                                                    <h4>
                                                        {testScore.passed ? "Placement Ready • Recommended for Selection" : "Needs Targeted Preparation • Below Cutoff"}
                                                    </h4>
                                                    <p>
                                                        Authentic assessment simulation for <strong>{mockTestData.company}</strong> ({mockTestData.role || targetRole}).
                                                        Eligibility cutoff threshold is 60%.
                                                    </p>
                                                </div>
                                                <div className="verdict-actions">
                                                    <button className="btn btn-primary" onClick={handleStartTest}>
                                                        🔄 Retake Assessment
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => setTestState("ready")}>
                                                        🏢 Change Company / Role
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Composite Metric Grid */}
                                            <div className="composite-metric-grid">
                                                <div className="metric-box overall-box">
                                                    <span className="metric-label">Composite Placement Index</span>
                                                    <div className="metric-value-wrap">
                                                        <span className="metric-value">{testScore.percentage}%</span>
                                                        <span className={`metric-pill ${testScore.passed ? "pill-pass" : "pill-fail"}`}>
                                                            {testScore.passed ? "PASS" : "FAIL"}
                                                        </span>
                                                    </div>
                                                    <span className="metric-subtext">
                                                        {testScore.hasCoding ? "Weighted: 60% MCQs + 40% Coding" : "Objective Assessment Score"}
                                                    </span>
                                                </div>

                                                <div className="metric-box mcq-box">
                                                    <span className="metric-label">Objective Round</span>
                                                    <div className="metric-value-wrap">
                                                        <span className="metric-value">{testScore.mcqScore} <small>/ {testScore.mcqTotal}</small></span>
                                                        <span className="metric-pill pill-neutral">{testScore.mcqPercentage}% Acc</span>
                                                    </div>
                                                    <div className="metric-breakdown-tags">
                                                        <span className="tag-correct">✓ {correctCount} Correct</span>
                                                        <span className="tag-incorrect">✕ {incorrectCount} Incorrect</span>
                                                        <span className="tag-skipped">○ {skippedCount} Skipped</span>
                                                    </div>
                                                </div>

                                                {testScore.hasCoding ? (
                                                    <div className="metric-box coding-box">
                                                        <span className="metric-label">Live Coding Round</span>
                                                        <div className="metric-value-wrap">
                                                            <span className="metric-value">{testScore.codingPassedCount} <small>/ {testScore.codingTotal}</small></span>
                                                            <span className={`metric-pill ${testScore.codingPassedCount > 0 ? "pill-pass" : "pill-fail"}`}>
                                                                {Math.round((testScore.codingPassedCount / (testScore.codingTotal || 1)) * 100)}% Solved
                                                            </span>
                                                        </div>
                                                        <span className="metric-subtext">
                                                            {testScore.codingPassedCount === testScore.codingTotal
                                                                ? "All algorithmic challenges cleared"
                                                                : `${testScore.codingPassedCount} of ${testScore.codingTotal} challenges cleared test suite`}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="metric-box speed-box">
                                                        <span className="metric-label">Accuracy & Coverage</span>
                                                        <div className="metric-value-wrap">
                                                            <span className="metric-value">
                                                                {Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100)}%
                                                            </span>
                                                            <span className="metric-pill pill-neutral">Attempt Accuracy</span>
                                                        </div>
                                                        <span className="metric-subtext">
                                                            {Math.round(((correctCount + incorrectCount) / (testScore.total || 1)) * 100)}% Questions Attempted
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Topic Performance Mastery */}
                                            {testScore.categoryBreakdown && Object.keys(testScore.categoryBreakdown).length > 0 && (
                                                <div className="score-category-mastery">
                                                    <span className="cat-mastery-title">Topic Performance Breakdown:</span>
                                                    <div className="cat-mastery-chips">
                                                        {Object.entries(testScore.categoryBreakdown).map(([cat, stat]) => {
                                                            const catPct = Math.round((stat.correct / stat.total) * 100);
                                                            const isStrong = catPct >= 70;
                                                            return (
                                                                <div key={cat} className={`cat-chip ${isStrong ? "chip-strong" : "chip-weak"}`}>
                                                                    <span className="cat-name">{cat}</span>
                                                                    <span className="cat-pct">{stat.correct}/{stat.total} ({catPct}%)</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Review Sub-Tabs (MCQ vs Coding) */}
                                        {mockTestData.codingSection && mockTestData.codingSection.length > 0 && (
                                            <div className="review-subtab-bar">
                                                <button
                                                    type="button"
                                                    className={`review-subtab-btn ${reviewSubTab === "mcq" ? "active" : ""}`}
                                                    onClick={() => setReviewSubTab("mcq")}
                                                >
                                                    <span>📝</span>
                                                    <span>Objective Questions Review ({mockTestData.questions.length})</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`review-subtab-btn ${reviewSubTab === "coding" ? "active" : ""}`}
                                                    onClick={() => setReviewSubTab("coding")}
                                                >
                                                    <span>💻</span>
                                                    <span>Live Coding Solutions Review ({mockTestData.codingSection.length})</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* VIEW 1: MCQ Objective Questions Review */}
                                        {reviewSubTab === "mcq" && (
                                            <div className="solutions-review-section">
                                                <div className="review-section-header">
                                                    <div>
                                                        <h3>📋 Objective Questions Detailed Review</h3>
                                                        <p>Compare your answers with official solutions and verified step-by-step recruiter explanations.</p>
                                                    </div>
                                                    <div className="review-filter-pills">
                                                        <button
                                                            type="button"
                                                            className={`filter-pill ${reviewFilter === "all" ? "active" : ""}`}
                                                            onClick={() => setReviewFilter("all")}
                                                        >
                                                            All ({mcqQuestions.length})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-pill pill-c ${reviewFilter === "correct" ? "active" : ""}`}
                                                            onClick={() => setReviewFilter("correct")}
                                                        >
                                                            ✓ Correct ({correctCount})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-pill pill-i ${reviewFilter === "incorrect" ? "active" : ""}`}
                                                            onClick={() => setReviewFilter("incorrect")}
                                                        >
                                                            ✕ Incorrect ({incorrectCount})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-pill pill-s ${reviewFilter === "skipped" ? "active" : ""}`}
                                                            onClick={() => setReviewFilter("skipped")}
                                                        >
                                                            ○ Skipped ({skippedCount})
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="solutions-list">
                                                    {filteredQuestions.map((q) => {
                                                        const originalIndex = mcqQuestions.findIndex(item => item.id === q.id);
                                                        const userChoice = selectedAnswers[q.id];
                                                        const isCorrect = userChoice === q.correctIndex;
                                                        const isSkipped = userChoice === undefined;

                                                        return (
                                                            <div
                                                                key={q.id}
                                                                className={`review-card ${isCorrect ? "card-correct" : isSkipped ? "card-skipped" : "card-incorrect"}`}
                                                            >
                                                                <div className="review-card-header">
                                                                    <div className="rc-left">
                                                                        <span className="rc-qnum">Question {originalIndex + 1}</span>
                                                                        <span className="rc-cat">{q.category}</span>
                                                                    </div>
                                                                    <div className="rc-right">
                                                                        {isCorrect && <span className="rc-badge badge-correct">✓ Correct (+1 Mark)</span>}
                                                                        {!isCorrect && !isSkipped && <span className="rc-badge badge-incorrect">✕ Incorrect (0 Marks)</span>}
                                                                        {isSkipped && <span className="rc-badge badge-skipped">○ Skipped (0 Marks)</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="review-card-body">
                                                                    <h4 className="rc-question-text">{q.question}</h4>

                                                                    {/* Comparative Answer Boxes */}
                                                                    <div className="rc-answers-compare-grid">
                                                                        <div className={`rc-ans-box ${isCorrect ? "ans-box-correct" : isSkipped ? "ans-box-skipped" : "ans-box-incorrect"}`}>
                                                                            <div className="ans-box-label">
                                                                                {isCorrect ? "✓ Your Selection (Correct)" : isSkipped ? "○ Your Selection (Skipped)" : "✕ Your Selection (Incorrect)"}
                                                                            </div>
                                                                            <div className="ans-box-content">
                                                                                {!isSkipped ? (
                                                                                    <>
                                                                                        <span className="ans-letter">{String.fromCharCode(65 + userChoice)}.</span>
                                                                                        <span className="ans-text">{q.options[userChoice]}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span className="ans-text text-muted">You skipped this question during the exam.</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="rc-ans-box ans-box-model">
                                                                            <div className="ans-box-label">
                                                                                ✓ Verified Correct Answer
                                                                            </div>
                                                                            <div className="ans-box-content">
                                                                                <span className="ans-letter">{String.fromCharCode(65 + q.correctIndex)}.</span>
                                                                                <span className="ans-text">{q.options[q.correctIndex]}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* All Options Breakdown */}
                                                                    <div className="rc-options-mini-list">
                                                                        <span className="mini-options-label">All Options Breakdown:</span>
                                                                        <div className="mini-options-grid">
                                                                            {q.options.map((opt, optIdx) => {
                                                                                const isThisCorrect = optIdx === q.correctIndex;
                                                                                const isThisUser = optIdx === userChoice;
                                                                                return (
                                                                                    <div
                                                                                        key={optIdx}
                                                                                        className={`mini-opt-item ${isThisCorrect ? "opt-correct-highlight" : ""} ${isThisUser && !isThisCorrect ? "opt-user-wrong" : ""}`}
                                                                                    >
                                                                                        <span className="opt-marker">
                                                                                            {String.fromCharCode(65 + optIdx)}
                                                                                            {isThisCorrect ? " ✓" : isThisUser ? " ✕" : ""}
                                                                                        </span>
                                                                                        <span className="opt-text">{opt}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    {/* Explanation Callout */}
                                                                    {q.explanation && (
                                                                        <div className="rc-explanation-callout">
                                                                            <div className="explanation-header">
                                                                                <span className="exp-icon">💡</span>
                                                                                <strong>Concept & Step-by-Step Explanation:</strong>
                                                                            </div>
                                                                            <div className="explanation-body">
                                                                                <p>{q.explanation}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* VIEW 2: Live Coding Solutions Review */}
                                        {reviewSubTab === "coding" && mockTestData.codingSection && (
                                            <div className="coding-solutions-review-section">
                                                <div className="review-section-header">
                                                    <div>
                                                        <h3>💻 Live Coding Challenges Review & Model Solutions</h3>
                                                        <p>Inspect your submitted code, test case execution traces, and company model solutions.</p>
                                                    </div>
                                                </div>

                                                <div className="coding-review-list">
                                                    {mockTestData.codingSection.map((prob, idx) => {
                                                        const sub = userCodingSubmissions[prob.id] || {};
                                                        const evalRes = sub.evalResult;
                                                        const isCleared = Boolean(evalRes?.allPassed || evalRes?.passed);
                                                        const passedTests = evalRes?.passedTestCases || 0;
                                                        const totalTests = evalRes?.totalTestCases || prob.testCases?.length || 0;

                                                        return (
                                                            <div key={prob.id} className={`coding-review-card ${isCleared ? "card-cleared" : "card-uncleared"}`}>
                                                                <div className="coding-rc-header">
                                                                    <div className="crc-left">
                                                                        <span className="crc-number">Challenge {idx + 1}</span>
                                                                        <h4 className="crc-title">{prob.title}</h4>
                                                                        <span className={`difficulty-badge ${prob.difficulty?.toLowerCase()}`}>
                                                                            {prob.difficulty}
                                                                        </span>
                                                                        <span className="category-badge">{prob.category}</span>
                                                                    </div>
                                                                    <div className="crc-right">
                                                                        {isCleared ? (
                                                                            <span className="status-pill status-pass">
                                                                                ✓ All Test Cases Passed ({totalTests}/{totalTests})
                                                                            </span>
                                                                        ) : sub.code ? (
                                                                            <span className="status-pill status-fail">
                                                                                ⚠️ Tests Passed: {passedTests}/{totalTests}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="status-pill status-neutral">
                                                                                ○ Not Submitted
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="coding-rc-body">
                                                                    <div className="problem-brief-box">
                                                                        <p className="brief-desc">{prob.description}</p>
                                                                        {prob.constraints && (
                                                                            <p className="brief-constraints">
                                                                                <strong>Constraints:</strong> <code>{prob.constraints}</code>
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="coding-review-grid">
                                                                        {/* Candidate Code Submission */}
                                                                        <div className="code-view-pane candidate-pane">
                                                                            <div className="code-pane-header">
                                                                                <span>👤 Your Submitted Solution ({sub.language || "javascript"})</span>
                                                                                {sub.evalResult?.executionTime && (
                                                                                    <span className="exec-time">⏱️ {sub.evalResult.executionTime}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="code-pane-content">
                                                                                {sub.code ? (
                                                                                    <pre className="code-block"><code>{sub.code}</code></pre>
                                                                                ) : (
                                                                                    <div className="no-code-notice">
                                                                                        <span>No solution code was submitted for this challenge.</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {evalRes?.testResults && evalRes.testResults.length > 0 && (
                                                                                <div className="testcases-trace-table-wrap">
                                                                                    <h5>Test Case Execution Traces:</h5>
                                                                                    <table className="testcases-trace-table">
                                                                                        <thead>
                                                                                            <tr>
                                                                                                <th>Test</th>
                                                                                                <th>Input</th>
                                                                                                <th>Expected</th>
                                                                                                <th>Actual</th>
                                                                                                <th>Status</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {evalRes.testResults.map((tc, tcIdx) => (
                                                                                                <tr key={tcIdx} className={tc.passed ? "tr-pass" : "tr-fail"}>
                                                                                                    <td>#{tcIdx + 1} {tc.isHidden ? "(Hidden)" : ""}</td>
                                                                                                    <td><code>{tc.input}</code></td>
                                                                                                    <td><code>{tc.expected}</code></td>
                                                                                                    <td><code>{tc.actual || "(No output)"}</code></td>
                                                                                                    <td>
                                                                                                        <span className={`tc-tag ${tc.passed ? "tag-pass" : "tag-fail"}`}>
                                                                                                            {tc.passed ? "✓ PASS" : "✕ FAIL"}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Reference Model Solution */}
                                                                        <div className="code-view-pane model-pane">
                                                                            <div className="code-pane-header">
                                                                                <span>💡 Optimal Reference Model Solution</span>
                                                                                {prob.timeComplexity && (
                                                                                    <span className="complexity-badge">
                                                                                        Time: {prob.timeComplexity} | Space: {prob.spaceComplexity || "O(1)"}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="code-pane-content">
                                                                                <pre className="code-block model-code">
                                                                                    <code>{prob.modelSolution || prob.modelAnswer || "// Optimal reference solution"}</code>
                                                                                </pre>
                                                                            </div>
                                                                            {prob.solutionExplanation && (
                                                                                <div className="model-explanation-callout">
                                                                                    <strong>Approach & Intuition:</strong>
                                                                                    <p>{prob.solutionExplanation}</p>
                                                                                </div>
                                                                            )}
                                                                            {prob.interviewTips && (
                                                                                <div className="model-tips-callout">
                                                                                    <strong>🎯 Recruiter Placement Tip:</strong>
                                                                                    <p>{prob.interviewTips}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* ==============================================================
                TAB 2: AI VOICE INTERVIEW & PERSONAL COMMUNICATION COACH
                ============================================================== */}
            {activeTab === "interview" && (
                <div className="mentor-content-pane">
                    {/* Top Sub-Mode Navigation Bar */}
                    <div className="interview-submode-navbar">
                        <button
                            type="button"
                            className={`submode-nav-btn ${interviewSubMode === "coach" ? "active" : ""}`}
                            onClick={() => setInterviewSubMode("coach")}
                        >
                            <span className="submode-icon">🎙️</span>
                            <div className="submode-info">
                                <span className="submode-title">Personal AI Voice Communication Coach</span>
                                <span className="submode-desc">Eliminate filler words, boost spoken English fluency & master elevator pitch</span>
                            </div>
                            <span className="submode-badge-pulse">NEW</span>
                        </button>

                        <button
                            type="button"
                            className={`submode-nav-btn ${interviewSubMode === "company" ? "active" : ""}`}
                            onClick={() => setInterviewSubMode("company")}
                        >
                            <span className="submode-icon">🏢</span>
                            <div className="submode-info">
                                <span className="submode-title">Company Placement Mock Interview</span>
                                <span className="submode-desc">Full-screen virtual interviewer simulating technical & HR rounds</span>
                            </div>
                        </button>
                    </div>

                    {/* =========================================================
                        SUB-MODE A: PERSONAL AI VOICE COMMUNICATION COACH
                        ========================================================= */}
                    {interviewSubMode === "coach" && (
                        <div className="voice-coach-container">
                            {/* Hero Header */}
                            <div className="voice-coach-hero">
                                <div className="coach-hero-text">
                                    <div className="coach-live-indicator">
                                        <span className={`coach-pulse-dot ${coachAudioPlaying ? "speaking" : isCoachListening ? "recording" : "online"}`}></span>
                                        <span>
                                            {coachAudioPlaying
                                                ? "🎙️ Coach Ananya Speaking..."
                                                : isCoachListening
                                                    ? "🔴 Recording Your Voice..."
                                                    : "AI Voice Coach Ready"}
                                        </span>
                                    </div>
                                    <h3>Personal Spoken Communication &amp; Fluency Coach</h3>
                                    <p>
                                        Practice speaking aloud in natural conversational English with your AI mentor. Build natural confidence, eliminate filler words, and prepare with 0% judgment and 100% student comfort.
                                    </p>
                                    <div className="coach-voice-persona-badge">
                                        <span className="persona-avatar">👩‍💼</span>
                                        <div className="persona-info">
                                            <strong>Coach Ananya &bull; Senior Placement Mentor</strong>
                                            <small>Natural, comforting female voice &bull; Empathetic, supportive pacing</small>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="btn-sample-voice"
                                            onClick={() => speakCoachMessage("Hey there! Don't worry at all about placement pressure. We are in this together, and we'll practice step-by-step until you feel completely relaxed and confident.")}
                                            disabled={coachAudioPlaying}
                                            title="Hear Coach Ananya's warm female voice"
                                        >
                                            {coachAudioPlaying ? "🔊 Speaking..." : "▶ Test Friendly Voice"}
                                        </button>
                                    </div>
                                </div>
                                <div className="coach-controls-quick">
                                    <label className="coach-autovoice-toggle">
                                        <input
                                            type="checkbox"
                                            checked={autoReadQuestion}
                                            onChange={(e) => setAutoReadQuestion(e.target.checked)}
                                        />
                                        <span>🔊 Auto-Spoken AI Voice Feedback</span>
                                    </label>
                                    {coachAudioPlaying && (
                                        <button type="button" className="btn-stop-audio" onClick={stopCoachAudio}>
                                            ⏹️ Stop Coach Voice
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 5 Curated Practice Modules */}
                            <div className="coach-topic-chips-row">
                                {[
                                    { id: "elevator_pitch", icon: "🌟", label: "Elevator Pitch", sub: "60-sec Intro" },
                                    { id: "project_walkthrough", icon: "💼", label: "Project STAR Method", sub: "Clear Explanations" },
                                    { id: "situational_hr", icon: "🗣️", label: "Behavioral & HR", sub: "Conflict & Pressure" },
                                    { id: "impromptu_extempore", icon: "⚡", label: "1-Min Extempore", sub: "Spontaneous Fluency" },
                                    { id: "conversational_fluency", icon: "💬", label: "Free Conversation", sub: "Fluency Booster" }
                                ].map((tab) => {
                                    const isSelected = coachTopic === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            className={`coach-topic-tab ${isSelected ? "active" : ""}`}
                                            onClick={() => handleSelectCoachTopic(tab.id)}
                                        >
                                            <span className="topic-tab-icon">{tab.icon}</span>
                                            <div className="topic-tab-labels">
                                                <strong>{tab.label}</strong>
                                                <small>{tab.sub}</small>
                                            </div>
                                            {isSelected && <span className="tab-active-dot">●</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Coach Studio Card */}
                            <div className="coach-studio-card">
                                {/* Prompt Box */}
                                <div className="coach-prompt-box">
                                    <div className="prompt-header-row">
                                        <div className="prompt-meta-left">
                                            <span className="prompt-track-tag">
                                                {coachTopicsData?.[coachTopic]?.title || "Practice Prompt"}
                                            </span>
                                            {coachTopicsData?.[coachTopic]?.framework && (
                                                <span className="prompt-framework-pill">
                                                    📐 Framework: {coachTopicsData[coachTopic].framework}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-listen-prompt"
                                            onClick={() => speakCoachMessage(activeCoachPrompt)}
                                            disabled={coachAudioPlaying}
                                        >
                                            <span>{coachAudioPlaying ? "🔊 Speaking..." : "🔊 Listen to Coach Voice"}</span>
                                        </button>
                                    </div>

                                    <h4 className="active-prompt-text">{activeCoachPrompt}</h4>

                                    {/* Quick prompt switcher pills */}
                                    {coachTopicsData?.[coachTopic]?.prompts && coachTopicsData[coachTopic].prompts.length > 1 && (
                                        <div className="coach-subprompts-pills">
                                            <span className="subprompts-label">Alternate Prompts:</span>
                                            {coachTopicsData[coachTopic].prompts.map((p, idx) => {
                                                const isCurr = p === activeCoachPrompt;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`subprompt-pill ${isCurr ? "active" : ""}`}
                                                        onClick={() => {
                                                            setActiveCoachPrompt(p);
                                                            setCoachTranscript("");
                                                            setCoachEvaluation(null);
                                                            stopCoachAudio();
                                                            stopCoachRecording();
                                                        }}
                                                    >
                                                        #{idx + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Voice Visualizer & Recording Dock */}
                                <div className="coach-recording-dock">
                                    <div className="recording-visual-bar">
                                        <div className={`coach-orb-indicator ${coachAudioPlaying ? "speaking" : isCoachListening ? "pulsing-red" : "idle"}`}>
                                            <span>{coachAudioPlaying ? "🔊" : isCoachListening ? "🎙️" : "💬"}</span>
                                        </div>
                                        <div className="recording-status-text">
                                            {isCoachListening ? (
                                                <div className="live-rec-timer">
                                                    <span className="rec-red-dot"></span>
                                                    <span>Live Recording Active: <strong>{coachSpeakingDuration}s</strong></span>
                                                    <span className="rec-hint">Speak clearly into your microphone in English...</span>
                                                </div>
                                            ) : (
                                                <div className="idle-rec-info">
                                                    <span>Press "Start Speaking Practice" and deliver your response aloud.</span>
                                                    <small>The AI will transcribe your speech in real-time and provide instant recruiter analytics.</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="coach-action-btn-row">
                                        <button
                                            type="button"
                                            className={`btn-mic-toggle ${isCoachListening ? "btn-recording-active" : "btn-recording-ready"}`}
                                            onClick={toggleCoachRecording}
                                        >
                                            <span>{isCoachListening ? "⏹️ Stop Recording" : "🎙️ Start Speaking Practice"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-evaluate-coach"
                                            onClick={handleEvaluateCoachSpeech}
                                            disabled={!coachTranscript.trim() || coachLoading}
                                        >
                                            <span>{coachLoading ? "Evaluating Fluency & WPM..." : "🚀 Analyze Spoken English & Diagnostics"}</span>
                                        </button>

                                        {coachTranscript && (
                                            <button
                                                type="button"
                                                className="btn-clear-transcript"
                                                onClick={() => {
                                                    setCoachTranscript("");
                                                    setCoachEvaluation(null);
                                                    setCoachSpeakingDuration(0);
                                                }}
                                                disabled={coachLoading || isCoachListening}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Live Transcribed Text Area (Editable in case of microphone typos) */}
                                    <div className="coach-transcript-wrap">
                                        <div className="transcript-header">
                                            <span>📝 Real-Time Spoken Transcript {coachSpeakingDuration > 0 ? `(${coachSpeakingDuration} seconds)` : ""}</span>
                                            <span className="transcript-tip">You can also type or edit text here directly</span>
                                        </div>
                                        <textarea
                                            className="coach-transcript-input"
                                            rows={3}
                                            placeholder="Your spoken words will appear here live as you speak into the microphone..."
                                            value={coachTranscript}
                                            onChange={(e) => setCoachTranscript(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Spoken Communication Diagnostics & Feedback Report */}
                            {coachEvaluation && (
                                <div className="coach-evaluation-report">
                                    {/* Composite Placement Index Banner */}
                                    <div className="coach-verdict-card">
                                        <div className="verdict-left">
                                            <div className="verdict-score-badge">
                                                <span className="v-num">{coachEvaluation.overallScore || coachEvaluation.fluencyScore}</span>
                                                <span className="v-den">/ 10</span>
                                            </div>
                                            <div>
                                                <h4>Placement Spoken Readiness Index</h4>
                                                <p>
                                                    {coachEvaluation.overallScore >= 8
                                                        ? "🌟 Excellent Fluency & Poise • High Recruiter Impact"
                                                        : coachEvaluation.overallScore >= 6.5
                                                            ? "👍 Good Conversational Flow • Minor Filler Word Polish Needed"
                                                            : "📈 Room for Structural Growth • Focus on Pacing & STAR Method"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="verdict-right">
                                            <span className={`verdict-status-pill ${coachEvaluation.overallScore >= 7.5 ? "pass" : "prep"}`}>
                                                {coachEvaluation.overallScore >= 7.5 ? "Placement Ready" : "Targeted Practice"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4 Pillars Metric Grid */}
                                    <div className="coach-metrics-grid">
                                        <div className="c-metric-card">
                                            <span className="c-metric-label">🗣️ Spoken Fluency</span>
                                            <div className="c-metric-val">
                                                <span>{coachEvaluation.fluencyScore}</span>
                                                <small>/ 10</small>
                                            </div>
                                            <span className="c-metric-sub">Sentence connectivity & vocabulary</span>
                                        </div>

                                        <div className="c-metric-card">
                                            <span className="c-metric-label">🦁 Confidence & Tone</span>
                                            <div className="c-metric-val">
                                                <span>{coachEvaluation.confidenceScore}</span>
                                                <small>/ 10</small>
                                            </div>
                                            <span className="c-metric-sub">Conviction & vocal assertiveness</span>
                                        </div>

                                        <div className="c-metric-card">
                                            <span className="c-metric-label">🎯 Structure & Clarity</span>
                                            <div className="c-metric-val">
                                                <span>{coachEvaluation.clarityScore}</span>
                                                <small>/ 10</small>
                                            </div>
                                            <span className="c-metric-sub">Framework & point articulation</span>
                                        </div>

                                        <div className="c-metric-card">
                                            <span className="c-metric-label">⏱️ Speaking Pace</span>
                                            <div className="c-metric-val">
                                                <span>{coachEvaluation.wpm}</span>
                                                <small>WPM</small>
                                            </div>
                                            <span className="c-metric-sub">{coachEvaluation.wpmVerdict || "Optimal: 120-165 WPM"}</span>
                                        </div>
                                    </div>

                                    {/* Filler Word Tracker */}
                                    <div className="filler-word-panel">
                                        <div className="filler-header">
                                            <span className="filler-title">
                                                {coachEvaluation.fillerCount > 0
                                                    ? `⚠️ ${coachEvaluation.fillerCount} Filler Words Detected:`
                                                    : "✨ Flawless Delivery — Zero Filler Words Detected!"}
                                            </span>
                                            <span className="filler-hint">
                                                Tip: Replace "um", "uh", "basically" with a deliberate 1-second pause. Pauses convey authority.
                                            </span>
                                        </div>
                                        {coachEvaluation.detectedFillers && coachEvaluation.detectedFillers.length > 0 && (
                                            <div className="filler-tags-list">
                                                {coachEvaluation.detectedFillers.map((fw, idx) => (
                                                    <span key={idx} className="filler-chip">
                                                        "{fw}"
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sentence Polishing & Upgrades */}
                                    {coachEvaluation.sentenceCorrections && coachEvaluation.sentenceCorrections.length > 0 && (
                                        <div className="sentence-polish-panel">
                                            <div className="polish-title">
                                                <span>✨ Recruiter Phrasing Polish (Upgrade Your English):</span>
                                            </div>
                                            <div className="polish-items-list">
                                                {coachEvaluation.sentenceCorrections.map((sc, idx) => (
                                                    <div key={idx} className="polish-item-card">
                                                        <div className="polish-col original-col">
                                                            <span className="col-label">What You Said:</span>
                                                            <p>"{sc.original}"</p>
                                                        </div>
                                                        <div className="polish-arrow">➔</div>
                                                        <div className="polish-col upgrade-col">
                                                            <span className="col-label">Recruiter-Grade Upgrade:</span>
                                                            <p>"{sc.improved}"</p>
                                                            {sc.reason && <small>{sc.reason}</small>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Strengths & Improvements */}
                                    <div className="coach-insights-grid">
                                        <div className="insight-card strengths-card">
                                            <h5>✅ Spoken Strengths</h5>
                                            <ul>
                                                {coachEvaluation.strengths?.map((str, idx) => (
                                                    <li key={idx}>{str}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="insight-card improvements-card">
                                            <h5>⚠️ Areas to Elevate</h5>
                                            <ul>
                                                {coachEvaluation.improvements?.map((imp, idx) => (
                                                    <li key={idx}>{imp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Gold Standard Model Speech */}
                                    {coachEvaluation.goldStandardSpeech && (
                                        <div className="gold-speech-card">
                                            <div className="gold-speech-header">
                                                <strong>💡 Gold Standard Delivery for this Question:</strong>
                                                <button
                                                    type="button"
                                                    className="btn-hear-gold"
                                                    onClick={() => speakCoachMessage(coachEvaluation.goldStandardSpeech)}
                                                    disabled={coachAudioPlaying}
                                                >
                                                    <span>🔊 Listen to Model Delivery</span>
                                                </button>
                                            </div>
                                            <p className="gold-speech-text">"{coachEvaluation.goldStandardSpeech}"</p>
                                        </div>
                                    )}

                                    {/* Coach Audio Feedback Callout & Next Prompt */}
                                    {coachEvaluation.coachSpokenFeedback && (
                                        <div className="coach-spoken-feedback-card">
                                            <div className="feedback-avatar">🎙️</div>
                                            <div className="feedback-text-wrap">
                                                <strong>AI Coach Spoken Advice:</strong>
                                                <p>"{coachEvaluation.coachSpokenFeedback}"</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-replay-feedback"
                                                onClick={() => speakCoachMessage(coachEvaluation.coachSpokenFeedback)}
                                                disabled={coachAudioPlaying}
                                            >
                                                <span>🔊 Replay Audio</span>
                                            </button>
                                        </div>
                                    )}

                                    {coachEvaluation.nextPrompt && (
                                        <div className="next-prompt-cta-bar">
                                            <button
                                                type="button"
                                                className="btn-next-prompt"
                                                onClick={() => {
                                                    setActiveCoachPrompt(coachEvaluation.nextPrompt);
                                                    setCoachTranscript("");
                                                    setCoachEvaluation(null);
                                                    setCoachSpeakingDuration(0);
                                                    stopCoachAudio();
                                                }}
                                            >
                                                <span>Next Practice Prompt: "{coachEvaluation.nextPrompt.slice(0, 50)}..." ➔</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Session History Feed */}
                            {coachHistory.length > 0 && (
                                <div className="coach-session-history">
                                    <h4>📜 Today's Speaking Practice History ({coachHistory.length} rounds)</h4>
                                    <div className="history-cards-scroll">
                                        {coachHistory.map((item, idx) => (
                                            <div key={idx} className="history-mini-card">
                                                <div className="hm-header">
                                                    <span className="hm-time">{item.timestamp}</span>
                                                    <span className="hm-score">Score: {item.evaluation?.overallScore || item.evaluation?.fluencyScore} / 10</span>
                                                    <span className="hm-wpm">{item.evaluation?.wpm} WPM</span>
                                                </div>
                                                <p className="hm-prompt">{item.prompt}</p>
                                                <p className="hm-transcript">"{item.transcript?.slice(0, 90)}..."</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================================================
                        SUB-MODE B: COMPANY PLACEMENT INTERVIEW SIMULATOR
                        ========================================================= */}
                    {interviewSubMode === "company" && (
                        <div className="mentor-control-card">
                            <div className="control-card-header">
                                <div>
                                    <h3 className="control-title">Interactive Company Placement Interview Simulator</h3>
                                    <p className="control-desc">
                                        Practice verbal self-introductions, technical questions, and HR situational scenarios tailored to <strong>ANY company across India</strong> in an immersive full-screen virtual room.
                                    </p>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleStartInterviewRoom}
                                >
                                    <span>🎙️ Launch Full-Screen Interview Room</span>
                                </button>
                            </div>

                            {/* Search & Role Inputs */}
                            <div className="mentor-search-inputs-grid">
                                <div className="mentor-input-block">
                                    <label className="input-field-label">Target Recruiter / Company</label>
                                    <input
                                        type="text"
                                        className="mentor-text-input"
                                        placeholder="Enter ANY company in India (e.g. Texmo, Roots, Pricol, Zoho, TCS, TVS, startups...)"
                                        value={interviewCompany}
                                        onChange={(e) => setInterviewCompany(e.target.value)}
                                    />
                                </div>

                                <div className="mentor-input-block">
                                    <label className="input-field-label">Target Job Role</label>
                                    <input
                                        type="text"
                                        className="mentor-text-input"
                                        placeholder="e.g. Software Development Engineer, Frontend Developer..."
                                        value={interviewRole}
                                        onChange={(e) => setInterviewRole(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Quick Start Card */}
                            <div style={{ marginTop: "24px", background: "#f8fafc", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>Simulated Interview Round Ready</h4>
                                <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
                                    The AI interviewer will simulate a real technical hiring manager from <strong>{interviewCompany}</strong> assessing you for <strong>{interviewRole}</strong>.
                                </p>
                                <button
                                    className="btn btn-primary btn-large"
                                    onClick={handleStartInterviewRoom}
                                >
                                    <span>🎙️ Enter Full-Screen Interview Room</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==============================================================
                TAB 3: COMPANY PYQ VAULT
                ============================================================== */}
            {activeTab === "pyq" && (
                <div className="mentor-content-pane">
                    <div className="mentor-control-card">
                        <div className="control-card-header">
                            <div>
                                <h3 className="control-title">Company Previous Year Questions (PYQs)</h3>
                                <p className="control-desc">
                                    Explore authentic technical interview questions, coding patterns, and system design challenges asked in past placement drives.
                                </p>
                            </div>
                        </div>

                        <div className="company-pills-row">
                            <div className="pills-scroll-container">
                                {popularCompanyChips.map((chipName) => {
                                    const isSelected = selectedCompany.toLowerCase() === chipName.toLowerCase();
                                    return (
                                        <button
                                            key={chipName}
                                            type="button"
                                            className={`company-pill-btn ${isSelected ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedCompany(chipName);
                                                fetchCompanyPYQs(chipName, targetRole);
                                            }}
                                        >
                                            <span className="pill-name">{chipName}</span>
                                            {isSelected && <span className="pill-check-indicator">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {pyqLoading && (
                        <div className="loading-card">
                            <div className="spinner"></div>
                            <p>Loading curated questions for {selectedCompany}...</p>
                        </div>
                    )}

                    {pyqData?.frequentQuestions && (
                        <div className="pyq-questions-stream">
                            {pyqData.frequentQuestions.map((q) => (
                                <div key={q.id} className="pyq-question-card">
                                    <div className="pyq-card-header">
                                        <span className="pyq-round-tag">{q.round}</span>
                                        <span className="pyq-cat-tag">{q.category}</span>
                                        <span className="pyq-freq-tag">{q.frequency}</span>
                                    </div>
                                    <h4 className="pyq-question-title">{q.question}</h4>
                                    <div className="pyq-answer-box">
                                        <strong>Model Answer:</strong>
                                        <p>{q.modelAnswer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==============================================================
                TAB 4: GOVT EXAM GUIDE
                ============================================================== */}
            {activeTab === "govt" && (
                <div className="mentor-content-pane">
                    <div className="mentor-control-card">
                        <h3 className="control-title">Government & Public Sector Exam Guide</h3>
                        <p className="control-desc">
                            Exam patterns, syllabus, and preparation strategies for UPSC, SSC CGL, RRB NTPC, and Banking exams.
                        </p>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            {["upsc", "ssc_cgl", "rrb_ntpc", "ibps_po"].map((key) => (
                                <button
                                    key={key}
                                    className={`company-pill-btn ${selectedGovtExam === key ? "active" : ""}`}
                                    onClick={() => setSelectedGovtExam(key)}
                                >
                                    {key.toUpperCase().replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {govtLoading && (
                        <div className="loading-card">
                            <div className="spinner"></div>
                            <p>Loading exam syllabus...</p>
                        </div>
                    )}

                    {govtData && (
                        <div className="pyq-question-card" style={{ marginTop: "20px" }}>
                            <h3>{govtData.examName}</h3>
                            <p>{govtData.description}</p>
                            {govtData.pattern && (
                                <div style={{ marginTop: "16px" }}>
                                    <strong>Exam Stages:</strong>
                                    <ul>
                                        {govtData.pattern.map((p, idx) => (
                                            <li key={idx}><strong>{p.stage}:</strong> {p.subjects} ({p.marks} Marks)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CareerAIMentor;
