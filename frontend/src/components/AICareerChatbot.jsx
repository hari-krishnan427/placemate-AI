import { useState, useEffect, useRef } from "react";

import { API } from "../config";

function AICareerChatbot({ user, setActivePage, onStartMockTest, onStartInterview }) {
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [candidateData, setCandidateData] = useState(null);
    const [starterPrompts, setStarterPrompts] = useState([]);
    const [suggestedFollowUps, setSuggestedFollowUps] = useState([]);
    const [isResetting, setIsResetting] = useState(false);
    const [resetFeedback, setResetFeedback] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load or Reset Chat Session & Grounding Data
    const loadInitialChat = async (isManualReset = false) => {
        if (isManualReset) {
            setIsResetting(true);
        }
        try {
            const res = await fetch(`${API}/api/mentor/chat/init`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setCandidateData(data.candidate || null);
                setStarterPrompts(data.starterPrompts || []);
                
                const topCompany = (data.starterPrompts && data.starterPrompts[1])
                    ? data.starterPrompts[1].replace(/.*?about\s+(.*?)(?:'s|\s+hiring).*/i, "$1")
                    : "Zoho";

                // Initial welcome bot greeting with unique ID to trigger fresh render
                setMessages([
                    {
                        id: `msg-init-${Date.now()}`,
                        role: "assistant",
                        content: data.welcomeMessage || "Hello! I'm your PlaceMate Career Copilot. Ask me anything about your resume, eligible companies, interview patterns, or practice mock tests!",
                        actions: [
                            {
                                type: "quick_prompt",
                                label: "🎯 Which companies am I eligible for?",
                                promptText: "Check my resume and tell me which companies I am eligible for right now"
                            },
                            {
                                type: "quick_prompt",
                                label: `🏢 Tell me about ${topCompany}'s interview process`,
                                promptText: `What is ${topCompany}, what do they do, and what questions do they ask?`
                            },
                            {
                                type: "mock_test",
                                label: `🚀 Launch ${topCompany} Mock Test Simulator`,
                                company: topCompany,
                                role: "Software Development Engineer"
                            }
                        ],
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                ]);
                setSuggestedFollowUps([]);
                setInputQuery("");

                if (isManualReset) {
                    setResetFeedback(true);
                    setTimeout(() => setResetFeedback(false), 2200);
                }
            }
        } catch (err) {
            console.error("Failed to initialize career chat session:", err);
        } finally {
            if (isManualReset) {
                setIsResetting(false);
            }
        }
    };

    useEffect(() => {
        loadInitialChat(false);
    }, []);

    // Send Message Handler
    const handleSendMessage = async (textToSend) => {
        const query = (textToSend || inputQuery).trim();
        if (!query || isLoading) return;

        const userMsg = {
            id: `msg-user-${Date.now()}`,
            role: "user",
            content: query,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        const updatedHistory = [...messages, userMsg];
        setMessages(updatedHistory);
        setInputQuery("");
        setIsLoading(true);

        try {
            // Prepare chat history payload for backend
            const historyPayload = messages.slice(-6).map((m) => ({
                role: m.role,
                content: m.content
            }));

            const res = await fetch(`${API}/api/mentor/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    message: query,
                    history: historyPayload
                })
            });

            if (!res.ok) throw new Error("Failed to receive response from Career Copilot");
            const data = await res.json();

            const botMsg = {
                id: `msg-bot-${Date.now()}`,
                role: "assistant",
                content: data.reply || "I've analyzed your question against your resume credentials.",
                actions: data.actions || [],
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setMessages((prev) => [...prev, botMsg]);
            if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
                setSuggestedFollowUps(data.suggestedFollowUps);
            }
        } catch (err) {
            console.error("Career Copilot messaging error:", err);
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-err-${Date.now()}`,
                    role: "assistant",
                    content: "⚠️ I encountered a brief network glitch while researching that question. Please try again or rephrase your prompt.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Action button dispatcher
    const handleActionClick = (action) => {
        if (!action) return;

        if (action.type === "quick_prompt" && action.promptText) {
            handleSendMessage(action.promptText);
            return;
        }

        if (action.type === "mock_test") {
            const company = action.company || "Zoho";
            const role = action.role || "Software Development Engineer";
            if (typeof onStartMockTest === "function") {
                onStartMockTest(company, role);
            } else if (typeof setActivePage === "function") {
                setActivePage("Mock Tests");
            }
            return;
        }

        if (action.type === "interview") {
            const company = action.company || "Zoho";
            const role = action.role || "Software Development Engineer";
            if (typeof onStartInterview === "function") {
                onStartInterview(company, role);
            } else if (typeof setActivePage === "function") {
                setActivePage("AI Interviewer");
            }
            return;
        }

        if (action.type === "view_jobs") {
            if (typeof setActivePage === "function") {
                setActivePage("Jobs");
            }
            return;
        }

        if (action.type === "govt_exam") {
            if (typeof setActivePage === "function") {
                setActivePage("Government Exams");
            }
            return;
        }
    };

    // Keydown handler (Enter = send, Shift+Enter = newline)
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format Markdown Helper (renders bold, code, lists, headers cleanly)
    const renderMarkdownContent = (text) => {
        if (!text) return "";
        const lines = text.split("\n");
        return lines.map((line, idx) => {
            // Header 3
            if (line.startsWith("### ")) {
                return <h3 key={idx} className="chat-h3">{line.replace("### ", "")}</h3>;
            }
            // Header 4
            if (line.startsWith("#### ")) {
                return <h4 key={idx} className="chat-h4">{line.replace("#### ", "")}</h4>;
            }
            // Bullet list item
            if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
                const cleanItem = line.trim().replace(/^[*-]\s+/, "");
                return (
                    <li key={idx} className="chat-bullet-li">
                        {renderInlineFormatting(cleanItem)}
                    </li>
                );
            }
            // Numbered list item
            if (/^\d+\.\s+/.test(line.trim())) {
                const cleanItem = line.trim().replace(/^\d+\.\s+/, "");
                return (
                    <div key={idx} className="chat-numbered-row">
                        <span className="chat-num-badge">{line.match(/^\d+/)[0]}.</span>
                        <span>{renderInlineFormatting(cleanItem)}</span>
                    </div>
                );
            }
            // Empty newline
            if (!line.trim()) {
                return <div key={idx} className="chat-spacer" />;
            }
            // Standard paragraph
            return <p key={idx} className="chat-p">{renderInlineFormatting(line)}</p>;
        });
    };

    // Simple parser for **bold** and `code` inline
    const renderInlineFormatting = (str) => {
        const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
                return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    return (
        <div className="career-copilot-container">
            {/* Top Candidate & Copilot Status Bar */}
            <div className="copilot-header-bar">
                <div className="copilot-identity">
                    <div className="copilot-avatar-wrap">
                        <div className="copilot-avatar">🤖</div>
                        <span className="copilot-pulse-dot" title="Copilot Online"></span>
                    </div>
                    <div>
                        <div className="copilot-name-row">
                            <h2 className="copilot-title">PlaceMate Career AI Copilot</h2>
                            <span className="copilot-online-badge">⚡ Real-Time Placement Mentor</span>
                        </div>
                        <p className="copilot-subtitle">
                            Grounded in your Document Vault resume, live job circulars, and official board question banks.
                        </p>
                    </div>
                </div>

                {candidateData && (
                    <div className="copilot-candidate-pill">
                        <span className="cand-icon">🎓</span>
                        <div className="cand-meta">
                            <strong>{candidateData.fullName || "Student Profile"}</strong>
                            <span>{candidateData.degree} • {candidateData.cgpa || 8.0} CGPA • Batch {candidateData.graduationYear}</span>
                        </div>
                        <button 
                            className={`btn-restart-chat ${resetFeedback ? "reset-success" : ""}`}
                            onClick={() => loadInitialChat(true)}
                            disabled={isResetting || isLoading}
                            title="Reset chat to start a new discussion"
                        >
                            {isResetting ? "⏳ Resetting..." : resetFeedback ? "✓ Reset!" : "🔄 Reset"}
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Starter Prompts Strip (Visible on fresh chat) */}
            {messages.length <= 1 && starterPrompts.length > 0 && (
                <div className="copilot-starters-section">
                    <span className="starters-label">💡 Suggested Questions to Ask Your Copilot:</span>
                    <div className="starters-pill-row">
                        {starterPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                className="starter-chip-btn"
                                onClick={() => handleSendMessage(prompt)}
                            >
                                <span>{prompt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Chat Stream */}
            <div className="copilot-chat-stream">
                {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                        <div key={msg.id} className={`chat-message-row ${isUser ? "user-row" : "bot-row"}`}>
                            {!isUser && (
                                <div className="chat-msg-avatar bot-avatar">
                                    <span>🧠</span>
                                </div>
                            )}

                            <div className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
                                <div className="bubble-header">
                                    <span className="bubble-sender">{isUser ? "You (Candidate)" : "PlaceMate Career Copilot"}</span>
                                    <span className="bubble-time">{msg.timestamp}</span>
                                </div>

                                <div className="bubble-content">
                                    {isUser ? <p className="chat-p">{msg.content}</p> : renderMarkdownContent(msg.content)}
                                </div>

                                {/* Dynamic Interactive Actions (Redirects to Mock Test, Interview, Jobs) */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="bubble-actions-grid">
                                        {msg.actions.map((act, actIdx) => (
                                            <button
                                                key={actIdx}
                                                type="button"
                                                className={`chat-action-btn ${act.type}`}
                                                onClick={() => handleActionClick(act)}
                                            >
                                                <span>{act.label || "Take Action →"}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isUser && (
                                <div className="chat-msg-avatar user-avatar">
                                    <span>👤</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="chat-message-row bot-row">
                        <div className="chat-msg-avatar bot-avatar">
                            <span>🧠</span>
                        </div>
                        <div className="chat-bubble bot-bubble loading-bubble">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span className="loading-caption">Copilot is analyzing your resume and company question archives...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Follow-Ups Strip */}
            {suggestedFollowUps.length > 0 && !isLoading && (
                <div className="copilot-followups-bar">
                    <span className="followup-tag">⚡ Quick Follow-Ups:</span>
                    <div className="followup-chips-wrap">
                        {suggestedFollowUps.map((q, qIdx) => (
                            <button
                                key={qIdx}
                                className="followup-btn"
                                onClick={() => handleSendMessage(q)}
                            >
                                <span>{q}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <div className="copilot-input-dock">
                <form 
                    className="copilot-input-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                >
                    <div className="input-textarea-wrapper">
                        <textarea
                            ref={inputRef}
                            className="copilot-textarea"
                            placeholder="Ask Copilot anything (e.g. 'Check which companies I'm eligible for', 'What questions does Zoho ask?', 'Give me a mock test')..."
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-copilot-send"
                        disabled={!inputQuery.trim() || isLoading}
                        title="Send message (Enter)"
                    >
                        {isLoading ? <div className="mini-spinner"></div> : <span>Send ➔</span>}
                    </button>
                </form>
                <div className="copilot-dock-hint">
                    <span>💡 Pro Tip: Press <strong>Enter</strong> to send. Press <strong>Shift + Enter</strong> for a new line. Ask for any company in India!</span>
                </div>
            </div>
        </div>
    );
}

export default AICareerChatbot;
