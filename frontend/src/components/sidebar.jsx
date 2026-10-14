function Sidebar({ activePage, setActivePage, user, onLogout }) {
    const displayName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Student");
    const userInitial = displayName.charAt(0).toUpperCase();

    const menuItems = [
        { id: "Dashboard", label: "Dashboard", icon: "🏠" },
        { id: "Documents", label: "Document Vault", icon: "📁", badge: "V1 Ready" },
        { id: "Profile", label: "Student Profile", icon: "🎓" },
        { id: "Jobs", label: "Jobs & Internships", icon: "💼" },
        { id: "Government Exams", label: "Government Exams", icon: "🏛️" },
        { id: "Mock Tests", label: "Company Mock Tests", icon: "📝", badge: "Simulator" },
        { id: "AI Interviewer", label: "AI Voice Interviewer", icon: "🎙️", badge: "Voice AI" },
        { id: "AI Assistant", label: "AI Career Copilot", icon: "🤖", badge: "Live AI" },
        { id: "Notifications", label: "Career Alerts", icon: "🔔", badge: "Radar" }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-logo">🧠</div>
                <div>
                    <h2 className="brand-title">DocMind AI</h2>
                    <span className="brand-tag">Career Platform</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-label">{item.label}</span>
                            {item.badge && (
                                <span className="sidebar-item-badge">{item.badge}</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-card" title={user?.email || displayName}>
                    <div className="sidebar-user-avatar">{userInitial}</div>
                    <div className="sidebar-user-details">
                        <span className="sidebar-user-name">{displayName}</span>
                        <span className="sidebar-user-role">Student Candidate</span>
                    </div>
                </div>

                <div className="sidebar-footer-tip">
                    <span className="tip-icon">💡</span>
                    <div>
                        <strong>Pro Tip</strong>
                        <p>Practice company mock tests to increase placement odds by 85%!</p>
                    </div>
                </div>

                {onLogout && (
                    <button
                        className="sidebar-logout-btn"
                        onClick={onLogout}
                    >
                        <span>🚪</span>
                        <span>Sign Out</span>
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;