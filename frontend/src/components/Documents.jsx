import { useState, useEffect } from "react";

import { API } from "../config";

const CATEGORIES = [
    { id: "all", label: "All Documents", icon: "📁" },
    { id: "resume", label: "Resumes & CVs", icon: "📄" },
    { id: "marksheet", label: "Marksheets & Transcripts", icon: "📊" },
    { id: "certificate", label: "Certifications", icon: "🏆" },
    { id: "id_proof", label: "ID Proofs", icon: "🪪" },
    { id: "other", label: "Other Documents", icon: "📎" }
];

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getCategoryBadge(category) {
    switch (category) {
        case "resume":
            return { label: "Resume / CV", color: "badge-green", icon: "📄" };
        case "marksheet":
            return { label: "Marksheet", color: "badge-blue", icon: "📊" };
        case "certificate":
            return { label: "Certificate", color: "badge-purple", icon: "🏆" };
        case "id_proof":
            return { label: "ID Proof", color: "badge-amber", icon: "🪪" };
        default:
            return { label: "Document", color: "badge-gray", icon: "📁" };
    }
}

function Documents({ setActivePage }) {
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        resume: 0,
        marksheet: 0,
        certificate: 0,
        id_proof: 0,
        other: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Filter & Search states
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Upload Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState("resume");
    const [uploadNotes, setUploadNotes] = useState("");
    const [uploading, setUploading] = useState(false);

    // Preview Modal state
    const [previewDoc, setPreviewDoc] = useState(null);

    // Delete Confirmation state
    const [deleteDoc, setDeleteDoc] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Extraction state
    const [extractingId, setExtractingId] = useState(null);

    // Document Q&A state (Option C Level 1)
    const [qaDoc, setQaDoc] = useState(null);
    const [qaQuestion, setQaQuestion] = useState("");
    const [qaHistory, setQaHistory] = useState([]);
    const [askingQa, setAskingQa] = useState(false);

    // Fetch documents
    async function fetchDocuments() {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (activeCategory !== "all") {
                params.append("category", activeCategory);
            }
            if (searchQuery.trim() !== "") {
                params.append("search", searchQuery.trim());
            }

            const res = await fetch(`${API}/documents?${params.toString()}`, {
                credentials: "include"
            });

            if (!res.ok) {
                if (res.status === 401) {
                    setError("Session expired. Please log in again.");
                    return;
                }
                throw new Error("Failed to load documents");
            }

            const data = await res.json();
            setDocuments(data.documents || []);
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError("Could not connect to server to fetch documents.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDocuments();
    }, [activeCategory, searchQuery]);

    // Handle File Upload
    async function handleUploadSubmit(e) {
        e.preventDefault();
        if (!uploadFile) {
            setError("Please choose a file to upload.");
            return;
        }

        setUploading(true);
        setError("");
        setSuccessMessage("");

        try {
            const formData = new FormData();
            formData.append("document", uploadFile);
            formData.append("category", uploadCategory);
            formData.append("notes", uploadNotes);

            const res = await fetch(`${API}/documents/upload`, {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to upload file");
            }

            setSuccessMessage(`"${uploadFile.name}" stored in vault successfully!`);
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadNotes("");
            setUploadCategory("resume");
            fetchDocuments();

            setTimeout(() => {
                setSuccessMessage("");
            }, 4000);
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Error uploading document.");
        } finally {
            setUploading(false);
        }
    }

    // Handle Resume Extraction
    async function handleExtractResume(doc) {
        setExtractingId(doc.id);
        setError("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API}/documents/${doc.id}/extract`, {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Extraction failed");
            }

            setSuccessMessage(
                `Resume intelligence extracted successfully (${data.extractedVia || "AI Engine"})! Go to 'Student Profile' in sidebar to view your profile.`
            );
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Extraction error:", err);
            setError(err.message || "Could not extract intelligence from this document.");
        } finally {
            setExtractingId(null);
        }
    }

    // Handle Document Q&A (Option C Level 1)
    async function handleAskQuestion(e) {
        if (e) e.preventDefault();
        if (!qaQuestion.trim() || !qaDoc) return;

        const currentQuestion = qaQuestion.trim();
        setQaQuestion("");
        setAskingQa(true);

        const newEntry = { question: currentQuestion, answer: "Thinking..." };
        setQaHistory((prev) => [...prev, newEntry]);

        try {
            const res = await fetch(`${API}/documents/${qaDoc.id}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ question: currentQuestion })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to answer question");
            }

            setQaHistory((prev) =>
                prev.map((item, idx) =>
                    idx === prev.length - 1 ? { question: currentQuestion, answer: data.answer } : item
                )
            );
        } catch (err) {
            console.error("Document Q&A error:", err);
            setQaHistory((prev) =>
                prev.map((item, idx) =>
                    idx === prev.length - 1
                        ? { question: currentQuestion, answer: "⚠️ Error: " + (err.message || "Could not generate answer") }
                        : item
                )
            );
        } finally {
            setAskingQa(false);
        }
    }

    // Handle Delete Document
    async function handleDeleteConfirm() {
        if (!deleteDoc) return;
        setDeleting(true);
        setError("");

        try {
            const res = await fetch(`${API}/documents/${deleteDoc.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to delete file");
            }

            setSuccessMessage(`Document removed from vault.`);
            setDeleteDoc(null);
            fetchDocuments();

            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message || "Could not delete document.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="vault-container">
            {/* Header Section */}
            <div className="vault-header">
                <div>
                    <h1 className="vault-title">Career Document Vault</h1>
                    <p className="vault-subtitle">
                        Store, organize, preview, and extract intelligence from your academic & professional credentials.
                    </p>
                </div>
                <button
                    className="btn btn-primary upload-btn"
                    onClick={() => {
                        setError("");
                        setShowUploadModal(true);
                    }}
                >
                    <span className="btn-icon">⬆️</span>
                    <span>Upload Document</span>
                </button>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="alert alert-success">
                    <span>✅ {successMessage}</span>
                    <button className="alert-close" onClick={() => setSuccessMessage("")}>×</button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    <span>⚠️ {error}</span>
                    <button className="alert-close" onClick={() => setError("")}>×</button>
                </div>
            )}

            {/* Vault Stats Bar */}
            <div className="vault-stats-grid">
                <div 
                    className={`stat-card card-total ${activeCategory === "all" ? "active" : ""}`} 
                    onClick={() => setActiveCategory("all")}
                    title="View all documents"
                >
                    <div className="stat-icon-wrapper stat-total">📁</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.total || 0}</div>
                        <div className="stat-label">Total Documents</div>
                    </div>
                </div>

                <div 
                    className={`stat-card card-resume ${activeCategory === "resume" ? "active" : ""}`} 
                    onClick={() => setActiveCategory("resume")}
                    title="Filter by Resumes & CVs"
                >
                    <div className="stat-icon-wrapper stat-resume">📄</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.resume || 0}</div>
                        <div className="stat-label">Resumes & CVs</div>
                    </div>
                </div>

                <div 
                    className={`stat-card card-marksheet ${activeCategory === "marksheet" ? "active" : ""}`} 
                    onClick={() => setActiveCategory("marksheet")}
                    title="Filter by Marksheets & Transcripts"
                >
                    <div className="stat-icon-wrapper stat-marksheet">📊</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.marksheet || 0}</div>
                        <div className="stat-label">Marksheets / Grades</div>
                    </div>
                </div>

                <div 
                    className={`stat-card card-certificate ${activeCategory === "certificate" ? "active" : ""}`} 
                    onClick={() => setActiveCategory("certificate")}
                    title="Filter by Certifications"
                >
                    <div className="stat-icon-wrapper stat-certificate">🏆</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.certificate || 0}</div>
                        <div className="stat-label">Certificates</div>
                    </div>
                </div>

                <div 
                    className={`stat-card card-id ${activeCategory === "id_proof" ? "active" : ""}`} 
                    onClick={() => setActiveCategory("id_proof")}
                    title="Filter by ID Proofs"
                >
                    <div className="stat-icon-wrapper stat-id">🪪</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.id_proof || 0}</div>
                        <div className="stat-label">ID Proofs</div>
                    </div>
                </div>
            </div>

            {/* Control Bar: Categories & Search */}
            <div className="vault-controls">
                <div className="category-tabs">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            {cat.id === "all" ? (
                                <span className="tab-count">{stats.total || 0}</span>
                            ) : stats[cat.id] ? (
                                <span className="tab-count">{stats[cat.id]}</span>
                            ) : null}
                        </button>
                    ))}
                </div>

                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search document name or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Document Listing Area */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your documents...</p>
                </div>
            ) : documents.length === 0 ? (
                <div className="empty-vault-state">
                    <div className="empty-icon">🗂️</div>
                    <h3>No documents found</h3>
                    <p>
                        {searchQuery
                            ? `No documents match "${searchQuery}". Try clearing the search.`
                            : activeCategory !== "all"
                            ? `No documents found in ${activeCategory}. Upload one now!`
                            : "Your career document vault is empty. Upload your resume and credentials to unlock AI intelligence and job matching!"}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setUploadCategory(activeCategory !== "all" ? activeCategory : "resume");
                            setShowUploadModal(true);
                        }}
                    >
                        + Upload First Document
                    </button>
                </div>
            ) : (
                <div className="documents-grid">
                    {documents.map((doc) => {
                        const badge = getCategoryBadge(doc.category);
                        const isPdf = (doc.file_type || "").includes("pdf");
                        const isImg = (doc.file_type || "").includes("image");
                        const isResume = doc.category === "resume";
                        const isExtracting = extractingId === doc.id;

                        return (
                            <div key={doc.id} className="doc-card">
                                <div className="doc-card-top">
                                    <div className="file-type-icon">
                                        {isPdf ? "📕" : isImg ? "🖼️" : "📄"}
                                    </div>
                                    <span className={`category-badge ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                    </span>
                                </div>

                                <div className="doc-card-body">
                                    <h4 className="doc-filename" title={doc.original_name || doc.filename}>
                                        {doc.original_name || doc.filename}
                                    </h4>
                                    {doc.notes && (
                                        <p className="doc-notes" title={doc.notes}>
                                            {doc.notes}
                                        </p>
                                    )}

                                    <div className="doc-meta">
                                        <span>📅 {formatDate(doc.uploaded_at)}</span>
                                        <span>📦 {formatBytes(doc.file_size)}</span>
                                    </div>
                                </div>

                                {/* Intelligent Action: Extract Profile (For Resumes) */}
                                {isResume && (
                                    <div className="doc-extract-banner">
                                        <button
                                            className="btn-extract-profile"
                                            onClick={() => handleExtractResume(doc)}
                                            disabled={isExtracting}
                                        >
                                            {isExtracting ? (
                                                <span>⏳ Extracting with AI...</span>
                                            ) : (
                                                <span>🧠 Extract & Build Profile</span>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <div className="doc-card-actions">
                                    <button
                                        className="doc-action-btn qa-btn"
                                        title="Ask questions about this document"
                                        onClick={() => {
                                            setQaDoc(doc);
                                            setQaHistory([]);
                                            setQaQuestion("");
                                        }}
                                    >
                                        💬 Ask Doc
                                    </button>

                                    <button
                                        className="doc-action-btn view-btn"
                                        title="Preview in browser"
                                        onClick={() => setPreviewDoc(doc)}
                                    >
                                        👁️ View
                                    </button>

                                    <a
                                        href={`${API}/documents/${doc.id}/download`}
                                        className="doc-action-btn download-btn"
                                        title="Download to computer"
                                        download
                                    >
                                        ⬇️
                                    </a>

                                    <button
                                        className="doc-action-btn delete-btn"
                                        title="Delete document"
                                        onClick={() => setDeleteDoc(doc)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* UPLOAD MODAL */}
            {showUploadModal && (
                <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-box upload-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Upload Career Document</h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowUploadModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Select File *</label>
                                    <div className="file-drop-area">
                                        <input
                                            type="file"
                                            id="file-input"
                                            className="file-hidden-input"
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setUploadFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <label htmlFor="file-input" className="file-drop-label">
                                            {uploadFile ? (
                                                <div className="selected-file-preview">
                                                    <span className="selected-file-icon">📄</span>
                                                    <span className="selected-file-name">{uploadFile.name}</span>
                                                    <span className="selected-file-size">
                                                        ({formatBytes(uploadFile.size)})
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="empty-drop-text">
                                                    <span className="cloud-icon">☁️</span>
                                                    <strong>Click to browse file</strong>
                                                    <span className="file-type-hint">
                                                        Supports PDF, DOCX, TXT, PNG, JPG, JPEG (Max 25MB)
                                                    </span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Category *</label>
                                    <select
                                        className="form-select"
                                        value={uploadCategory}
                                        onChange={(e) => setUploadCategory(e.target.value)}
                                    >
                                        <option value="resume">📄 Resume / CV (Used for Career Matching)</option>
                                        <option value="marksheet">📊 Marksheet / Grade Sheet / Transcript</option>
                                        <option value="certificate">🏆 Course / Skill / Honor Certificate</option>
                                        <option value="id_proof">🪪 Identity Proof (College ID / Aadhar / PAN)</option>
                                        <option value="other">📁 Other Document</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Notes / Label (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. S6 Marksheet, AWS Certified Cloud Practitioner"
                                        value={uploadNotes}
                                        onChange={(e) => setUploadNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!uploadFile || uploading}
                                >
                                    {uploading ? "Uploading to Vault..." : "Save to Vault"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DOCUMENT Q&A MODAL (OPTION C LEVEL 1) */}
            {qaDoc && (
                <div className="modal-backdrop" onClick={() => setQaDoc(null)}>
                    <div className="modal-box qa-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="qa-badge-small">💬 Document Intelligence Q&A</div>
                                <h3 className="qa-modal-title" title={qaDoc.original_name || qaDoc.filename}>
                                    Ask about: {qaDoc.original_name || qaDoc.filename}
                                </h3>
                            </div>
                            <button className="modal-close-btn" onClick={() => setQaDoc(null)}>
                                ×
                            </button>
                        </div>

                        <div className="qa-modal-body">
                            {/* Suggested Prompts */}
                            <div className="qa-prompt-chips">
                                <span className="chip-label">Suggestions:</span>
                                <button
                                    className="prompt-chip"
                                    onClick={() => setQaQuestion("Summarize this document in 3 bullet points.")}
                                >
                                    📋 Summarize
                                </button>
                                <button
                                    className="prompt-chip"
                                    onClick={() => setQaQuestion("List all technical skills and tools found.")}
                                >
                                    ⚡ List skills
                                </button>
                                <button
                                    className="prompt-chip"
                                    onClick={() => setQaQuestion("What is the CGPA or grade mentioned?")}
                                >
                                    📊 Find CGPA
                                </button>
                                <button
                                    className="prompt-chip"
                                    onClick={() => setQaQuestion("What projects are mentioned in this file?")}
                                >
                                    🚀 List projects
                                </button>
                            </div>

                            {/* Q&A Chat Stream */}
                            <div className="qa-chat-stream">
                                {qaHistory.length === 0 ? (
                                    <div className="qa-empty-chat">
                                        <span className="qa-empty-icon">🤖</span>
                                        <p>
                                            Ask any question about this document. DocMind AI answers strictly based on the text inside this file!
                                        </p>
                                    </div>
                                ) : (
                                    qaHistory.map((item, idx) => (
                                        <div key={idx} className="qa-message-group">
                                            <div className="qa-user-bubble">
                                                <strong>You:</strong> {item.question}
                                            </div>
                                            <div className="qa-ai-bubble">
                                                <strong>DocMind AI:</strong>
                                                <div className="qa-answer-text">{item.answer}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Field */}
                            <form className="qa-input-form" onSubmit={handleAskQuestion}>
                                <input
                                    type="text"
                                    className="qa-input"
                                    placeholder="Type your question about this document..."
                                    value={qaQuestion}
                                    onChange={(e) => setQaQuestion(e.target.value)}
                                    disabled={askingQa}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary qa-send-btn"
                                    disabled={!qaQuestion.trim() || askingQa}
                                >
                                    {askingQa ? "..." : "Ask"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {previewDoc && (
                <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
                    <div className="modal-box preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="preview-header-left">
                                <span className="preview-icon">👁️</span>
                                <h3 className="preview-title" title={previewDoc.original_name || previewDoc.filename}>
                                    {previewDoc.original_name || previewDoc.filename}
                                </h3>
                            </div>
                            <div className="preview-header-actions">
                                <a
                                    href={`${API}/documents/${previewDoc.id}/view`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                >
                                    ↗️ Open in New Tab
                                </a>
                                <a
                                    href={`${API}/documents/${previewDoc.id}/download`}
                                    className="btn btn-primary btn-sm"
                                    download
                                >
                                    ⬇️ Download
                                </a>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => setPreviewDoc(null)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="preview-modal-body">
                            {(previewDoc.file_type || "").includes("pdf") ? (
                                <iframe
                                    src={`${API}/documents/${previewDoc.id}/view`}
                                    title="Document Preview"
                                    className="preview-iframe"
                                />
                            ) : (previewDoc.file_type || "").includes("image") ? (
                                <div className="preview-image-container">
                                    <img
                                        src={`${API}/documents/${previewDoc.id}/view`}
                                        alt={previewDoc.original_name || "Preview"}
                                        className="preview-image"
                                    />
                                </div>
                            ) : (
                                <div className="preview-unsupported">
                                    <div className="unsupported-icon">📄</div>
                                    <h4>In-browser preview is not available for this file type</h4>
                                    <p>You can download it to view on your device.</p>
                                    <a
                                        href={`${API}/documents/${previewDoc.id}/download`}
                                        className="btn btn-primary"
                                        download
                                    >
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteDoc && (
                <div className="modal-backdrop" onClick={() => !deleting && setDeleteDoc(null)}>
                    <div className="modal-box delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Document Deletion</h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => setDeleteDoc(null)}
                                disabled={deleting}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to permanently delete:</p>
                            <p className="delete-target-name">
                                <strong>"{deleteDoc.original_name || deleteDoc.filename}"</strong>
                            </p>
                            <p className="text-warning-muted">
                                This action cannot be undone. This document will be completely removed from your vault.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteDoc(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Yes, Delete Document"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Documents;