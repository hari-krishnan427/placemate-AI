import { useState, useEffect } from "react";

import { API } from "../config";

function Profile({ setActivePage, onProfileUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Edit modal states
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: "",
        phone: "",
        location: "",
        degree: "",
        branch: "",
        institution: "",
        graduation_year: 2026,
        cgpa: "",
        skillsList: [],
        newSkillInput: "",
        preferredRolesList: [],
        newRoleInput: "",
        github_url: "",
        linkedin_url: "",
        portfolio_url: "",
        standing_arrears: 0
    });
    const [saving, setSaving] = useState(false);

    async function fetchProfile() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/profile`, {
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch profile");
            }
            const data = await res.json();
            setProfile(data.profile);
            if (data.profile) {
                if (onProfileUpdate && data.profile.full_name) {
                    onProfileUpdate(data.profile);
                }
                const rawSkills = Array.isArray(data.profile.skills) 
                    ? data.profile.skills 
                    : typeof data.profile.skills === "string" 
                    ? JSON.parse(data.profile.skills || "[]") 
                    : [];
                const rawRoles = Array.isArray(data.profile.preferred_roles)
                    ? data.profile.preferred_roles
                    : typeof data.profile.preferred_roles === "string"
                    ? JSON.parse(data.profile.preferred_roles || "[]")
                    : [];

                setEditForm({
                    full_name: data.profile.full_name || "",
                    phone: data.profile.phone || "",
                    location: data.profile.location || "",
                    degree: data.profile.degree || "",
                    branch: data.profile.branch || "",
                    institution: data.profile.institution || "",
                    graduation_year: data.profile.graduation_year || 2026,
                    cgpa: data.profile.cgpa || "",
                    skillsList: rawSkills,
                    newSkillInput: "",
                    preferredRolesList: rawRoles,
                    newRoleInput: "",
                    github_url: data.profile.github_url || "",
                    linkedin_url: data.profile.linkedin_url || "",
                    portfolio_url: data.profile.portfolio_url || "",
                    standing_arrears: data.profile.standing_arrears !== undefined ? data.profile.standing_arrears : 0
                });
            }
        } catch (err) {
            console.error("Profile load error:", err);
            setError("Could not load student profile from server.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleAddSkillKey = (e) => {
        if ((e.key === "Enter" || e.key === ",") && editForm.newSkillInput.trim()) {
            e.preventDefault();
            const val = editForm.newSkillInput.trim().replace(/^,|,$/g, "");
            if (val && !editForm.skillsList.includes(val)) {
                setEditForm(prev => ({
                    ...prev,
                    skillsList: [...prev.skillsList, val],
                    newSkillInput: ""
                }));
            } else {
                setEditForm(prev => ({ ...prev, newSkillInput: "" }));
            }
        }
    };

    const handleAddSkillClick = (e) => {
        e.preventDefault();
        const val = editForm.newSkillInput.trim().replace(/^,|,$/g, "");
        if (val && !editForm.skillsList.includes(val)) {
            setEditForm(prev => ({
                ...prev,
                skillsList: [...prev.skillsList, val],
                newSkillInput: ""
            }));
        } else {
            setEditForm(prev => ({ ...prev, newSkillInput: "" }));
        }
    };

    const handleRemoveSkill = (skill) => {
        setEditForm(prev => ({
            ...prev,
            skillsList: prev.skillsList.filter(s => s !== skill)
        }));
    };

    const handleAddRoleKey = (e) => {
        if ((e.key === "Enter" || e.key === ",") && editForm.newRoleInput.trim()) {
            e.preventDefault();
            const val = editForm.newRoleInput.trim().replace(/^,|,$/g, "");
            if (val && !editForm.preferredRolesList.includes(val)) {
                setEditForm(prev => ({
                    ...prev,
                    preferredRolesList: [...prev.preferredRolesList, val],
                    newRoleInput: ""
                }));
            } else {
                setEditForm(prev => ({ ...prev, newRoleInput: "" }));
            }
        }
    };

    const handleAddRoleClick = (e) => {
        e.preventDefault();
        const val = editForm.newRoleInput.trim().replace(/^,|,$/g, "");
        if (val && !editForm.preferredRolesList.includes(val)) {
            setEditForm(prev => ({
                ...prev,
                preferredRolesList: [...prev.preferredRolesList, val],
                newRoleInput: ""
            }));
        } else {
            setEditForm(prev => ({ ...prev, newRoleInput: "" }));
        }
    };

    const handleRemoveRole = (role) => {
        setEditForm(prev => ({
            ...prev,
            preferredRolesList: prev.preferredRolesList.filter(r => r !== role)
        }));
    };

    async function handleSaveEdit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const res = await fetch(`${API}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    full_name: editForm.full_name,
                    phone: editForm.phone,
                    location: editForm.location,
                    degree: editForm.degree,
                    branch: editForm.branch,
                    institution: editForm.institution,
                    graduation_year: parseInt(editForm.graduation_year, 10) || 2026,
                    cgpa: editForm.cgpa ? parseFloat(editForm.cgpa) : null,
                    skills: editForm.skillsList,
                    projects: profile?.projects || [],
                    experience: profile?.experience || [],
                    certifications: profile?.certifications || [],
                    github_url: editForm.github_url,
                    linkedin_url: editForm.linkedin_url,
                    portfolio_url: editForm.portfolio_url,
                    standing_arrears: parseInt(editForm.standing_arrears, 10) || 0,
                    preferred_roles: editForm.preferredRolesList
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to update profile");
            }

            setSuccessMsg("Profile updated successfully!");
            setIsEditing(false);
            if (onProfileUpdate && editForm.full_name) {
                onProfileUpdate({ full_name: editForm.full_name });
            }
            fetchProfile();

            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error("Save profile error:", err);
            setError(err.message || "Could not save profile changes.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading student career profile...</p>
            </div>
        );
    }

    // AUTHENTIC EMPTY STATE (Zero fake data)
    if (!profile) {
        return (
            <div className="profile-container">
                <div className="profile-empty-card">
                    <div className="empty-icon-large">🎓</div>
                    <h2>No Student Profile Built Yet</h2>
                    <p className="profile-empty-desc">
                        PlaceMate AI creates your real career profile automatically by extracting your actual skills, degree, CGPA, and projects from your resume.
                    </p>
                    <div className="profile-steps-box">
                        <h4>How to build your profile in 10 seconds:</h4>
                        <ol>
                            <li>Go to <strong>Document Vault</strong>.</li>
                            <li>Upload your actual resume (PDF or DOCX).</li>
                            <li>Click the <strong>"🧠 Extract Profile"</strong> button.</li>
                        </ol>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setActivePage("Documents")}
                    >
                        <span>📁</span> Go to Document Vault to Upload Resume
                    </button>
                </div>
            </div>
        );
    }

    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    const experience = Array.isArray(profile.experience) ? profile.experience : [];
    const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
    const preferredRoles = Array.isArray(profile.preferred_roles) ? profile.preferred_roles : [];

    return (
        <div className="profile-container">
            {/* Header Banner */}
            <div className="profile-header-card">
                <div className="profile-main-info">
                    <div className="profile-avatar-large">
                        {(profile.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="profile-title-row">
                            <h1 className="profile-name">{profile.full_name || "Student"}</h1>
                            <span className="profile-badge-active">Verified Candidate</span>
                        </div>
                        <p className="profile-academic">
                            {profile.degree} {profile.branch ? `• ${profile.branch}` : ""}
                        </p>
                        <p className="profile-inst">
                            {profile.institution ? `🏛️ ${profile.institution}` : ""}
                            {profile.location ? ` • 📍 ${profile.location}` : ""}
                        </p>
                        {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
                            <div className="profile-social-links-row" style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                                {profile.github_url && (
                                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#93c5fd", textDecoration: "none", background: "rgba(59, 130, 246, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                                        <span>🐙 GitHub</span>
                                    </a>
                                )}
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#60a5fa", textDecoration: "none", background: "rgba(37, 99, 235, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                                        <span>💼 LinkedIn</span>
                                    </a>
                                )}
                                {profile.portfolio_url && (
                                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#34d399", textDecoration: "none", background: "rgba(16, 185, 129, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                                        <span>🌐 Portfolio</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-actions-header">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsEditing(true)}
                    >
                        ✏️ Edit Profile
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setActivePage("Jobs")}
                    >
                        💼 View Job Matches
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {successMsg && (
                <div className="alert alert-success">
                    <span>✅ {successMsg}</span>
                    <button className="alert-close" onClick={() => setSuccessMsg("")}>×</button>
                </div>
            )}
            {error && (
                <div className="alert alert-danger">
                    <span>⚠️ {error}</span>
                    <button className="alert-close" onClick={() => setError("")}>×</button>
                </div>
            )}

            {/* Highlights Grid */}
            <div className="profile-highlights-grid">
                <div className="highlight-metric-card">
                    <span className="metric-icon">🎓</span>
                    <div>
                        <div className="metric-label">Graduation Year</div>
                        <div className="metric-val">{profile.graduation_year || "2026"}</div>
                    </div>
                </div>

                <div className="highlight-metric-card">
                    <span className="metric-icon">📊</span>
                    <div>
                        <div className="metric-label">CGPA / Grade</div>
                        <div className="metric-val">
                            {profile.cgpa ? `${profile.cgpa} / 10` : "Not specified"}
                        </div>
                    </div>
                </div>

                <div className="highlight-metric-card">
                    <span className="metric-icon">⚡</span>
                    <div>
                        <div className="metric-label">Technical Skills</div>
                        <div className="metric-val">{skills.length} Detected</div>
                    </div>
                </div>

                <div className="highlight-metric-card">
                    <span className="metric-icon">{profile.standing_arrears === 0 || !profile.standing_arrears ? "🛡️" : "⚠️"}</span>
                    <div>
                        <div className="metric-label">Arrears / Backlogs</div>
                        <div className="metric-val" style={{ color: profile.standing_arrears === 0 || !profile.standing_arrears ? "#10b981" : "#f59e0b" }}>
                            {profile.standing_arrears === 0 || !profile.standing_arrears ? "0 (Verified)" : `${profile.standing_arrears} Active`}
                        </div>
                    </div>
                </div>

                <div className="highlight-metric-card">
                    <span className="metric-icon">📂</span>
                    <div>
                        <div className="metric-label">Source Resume</div>
                        <div className="metric-val source-file-text" title={profile.resume_filename || "Uploaded File"}>
                            {profile.resume_filename || "Uploaded Resume"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Two Column Layout: Skills & Projects */}
            <div className="profile-body-grid">
                {/* Skills Section */}
                <div className="profile-section-card">
                    <div className="section-head">
                        <h3>🛠️ Skills & Target Roles</h3>
                        <span className="count-pill">{skills.length} Skills</span>
                    </div>

                    {preferredRoles.length > 0 && (
                        <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#34d399", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                🎯 Preferred Placement Roles
                            </div>
                            <div className="skills-badge-wrap">
                                {preferredRoles.map((role, idx) => (
                                    <span key={idx} className="skill-pill" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.35)", color: "#a7f3d0" }}>
                                        🎯 {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {skills.length === 0 ? (
                        <p className="muted-text">No technical skills detected yet.</p>
                    ) : (
                        <div className="skills-badge-wrap">
                            {skills.map((skill, idx) => (
                                <span key={idx} className="skill-pill">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Projects Section */}
                <div className="profile-section-card">
                    <div className="section-head">
                        <h3>🚀 Academic & Personal Projects</h3>
                        <span className="count-pill">{projects.length} Projects</span>
                    </div>

                    {projects.length === 0 ? (
                        <p className="muted-text">
                            No projects extracted. You can add them by editing your profile.
                        </p>
                    ) : (
                        <div className="projects-card-stack">
                            {projects.map((proj, idx) => (
                                <div key={idx} className="project-item-box">
                                    <div className="project-item-title">{proj.title || "Project"}</div>
                                    {proj.description && (
                                        <p className="project-item-desc">{proj.description}</p>
                                    )}
                                    {proj.techStack && proj.techStack.length > 0 && (
                                        <div className="project-tech-tags">
                                            {proj.techStack.map((tech, tIdx) => (
                                                <span key={tIdx} className="tech-mini-tag">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Experience & Certifications (if any) */}
            {(experience.length > 0 || certifications.length > 0) && (
                <div className="profile-body-grid">
                    {experience.length > 0 && (
                        <div className="profile-section-card">
                            <div className="section-head">
                                <h3>💼 Experience & Internships</h3>
                            </div>
                            <div className="projects-card-stack">
                                {experience.map((exp, idx) => (
                                    <div key={idx} className="project-item-box">
                                        <div className="project-item-title">{exp.role || "Intern"}</div>
                                        <div className="exp-company">
                                            {exp.company} {exp.duration ? `• ${exp.duration}` : ""}
                                        </div>
                                        {exp.description && (
                                            <p className="project-item-desc">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {certifications.length > 0 && (
                        <div className="profile-section-card">
                            <div className="section-head">
                                <h3>🏆 Certifications & Achievements</h3>
                            </div>
                            <ul className="cert-list">
                                {certifications.map((cert, idx) => (
                                    <li key={idx} className="cert-item">
                                        🏅 {typeof cert === "string" ? cert : cert.title || "Certification"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {isEditing && (
                <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
                    <div className="modal-box edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Career Profile Details</h3>
                            <button className="modal-close-btn" onClick={() => setIsEditing(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.full_name}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, full_name: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label className="form-label">Degree (e.g. B.E, B.Tech)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editForm.degree}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, degree: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Branch (e.g. Computer Science)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editForm.branch}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, branch: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">College / University</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.institution}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, institution: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label className="form-label">Graduation Year</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editForm.graduation_year}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    graduation_year: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CGPA / Percentage</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            placeholder="e.g. 8.4"
                                            value={editForm.cgpa}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, cgpa: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Interactive Technical Skills Tag Input */}
                                <div className="form-group" style={{ marginTop: "10px" }}>
                                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Technical Skills</span>
                                        <span style={{ color: "#818cf8", fontSize: "11px", fontWeight: "600" }}>Type skill & press Enter ↵</span>
                                    </label>
                                    <div className="tag-input-row" style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. React, Python, PostgreSQL, AWS, Docker..."
                                            value={editForm.newSkillInput}
                                            onChange={(e) => setEditForm({ ...editForm, newSkillInput: e.target.value })}
                                            onKeyDown={handleAddSkillKey}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ padding: "8px 14px", whiteSpace: "nowrap", fontSize: "12px" }}
                                            onClick={handleAddSkillClick}
                                        >
                                            ＋ Add
                                        </button>
                                    </div>
                                    <div className="skills-badge-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "38px", padding: "8px 10px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                        {editForm.skillsList.length === 0 ? (
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>No skills added yet. Type a skill above and press Enter.</span>
                                        ) : (
                                            editForm.skillsList.map((skill, sIdx) => (
                                                <span key={sIdx} className="skill-pill" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#c7d2fe", padding: "3px 8px", borderRadius: "14px", fontSize: "12px" }}>
                                                    <span>{skill}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSkill(skill)}
                                                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                                                        title="Remove skill"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Interactive Preferred Target Roles Tag Input */}
                                <div className="form-group" style={{ marginTop: "14px" }}>
                                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Target Career Roles</span>
                                        <span style={{ color: "#34d399", fontSize: "11px", fontWeight: "600" }}>Type role & press Enter ↵</span>
                                    </label>
                                    <div className="tag-input-row" style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. SDE-1, Frontend Developer, Data Analyst..."
                                            value={editForm.newRoleInput}
                                            onChange={(e) => setEditForm({ ...editForm, newRoleInput: e.target.value })}
                                            onKeyDown={handleAddRoleKey}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ padding: "8px 14px", whiteSpace: "nowrap", fontSize: "12px" }}
                                            onClick={handleAddRoleClick}
                                        >
                                            ＋ Add
                                        </button>
                                    </div>
                                    <div className="roles-badge-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "38px", padding: "8px 10px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                        {editForm.preferredRolesList.length === 0 ? (
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>No target roles added yet. Type a role above and press Enter.</span>
                                        ) : (
                                            editForm.preferredRolesList.map((role, rIdx) => (
                                                <span key={rIdx} className="role-pill" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#a7f3d0", padding: "3px 8px", borderRadius: "14px", fontSize: "12px" }}>
                                                    <span>🎯 {role}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRole(role)}
                                                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                                                        title="Remove role"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Social & Professional Links */}
                                <div className="form-row-2" style={{ marginTop: "14px" }}>
                                    <div className="form-group">
                                        <label className="form-label">GitHub Profile URL</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            placeholder="https://github.com/yourhandle"
                                            value={editForm.github_url}
                                            onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">LinkedIn Profile URL</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            placeholder="https://linkedin.com/in/yourhandle"
                                            value={editForm.linkedin_url}
                                            onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row-2" style={{ marginTop: "14px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Portfolio / Project URL</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            placeholder="https://yourportfolio.dev"
                                            value={editForm.portfolio_url}
                                            onChange={(e) => setEditForm({ ...editForm, portfolio_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Standing Backlogs / Arrears</label>
                                        <select
                                            className="form-input"
                                            value={editForm.standing_arrears}
                                            onChange={(e) => setEditForm({ ...editForm, standing_arrears: parseInt(e.target.value, 10) || 0 })}
                                        >
                                            <option value="0">🟢 0 Standing Arrears (Eligible for all Tier-1 Drives)</option>
                                            <option value="1">🟡 1 Standing Arrear</option>
                                            <option value="2">🟠 2 Standing Arrears</option>
                                            <option value="3">🔴 3+ Standing Arrears</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving Changes..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
