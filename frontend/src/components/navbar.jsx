function Navbar({ activePage, user, onLogout, onToggleMobileMenu, isMobileMenuOpen }) {
    const displayName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Student");
    const userInitial = displayName.charAt(0).toUpperCase();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button
                    className="mobile-menu-toggle"
                    onClick={onToggleMobileMenu}
                    aria-label="Toggle navigation menu"
                    title="Menu"
                >
                    <span className="hamburger-icon">{isMobileMenuOpen ? "✕" : "☰"}</span>
                </button>
                <div className="navbar-title-group">
                    <h2 className="navbar-title">{activePage}</h2>
                    <span className="navbar-tagline">PlaceMate AI Career Intelligence</span>
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-profile-badge" title={user?.email ? `${displayName} (${user.email})` : displayName}>
                    <div className="user-avatar">{userInitial}</div>
                    <div className="user-badge-info">
                        <span className="user-email">
                            {displayName}
                        </span>
                        {user?.fullName && user?.email && (
                            <span className="user-sub-email">{user.email}</span>
                        )}
                    </div>
                </div>

                {onLogout && (
                    <button
                        className="btn-logout"
                        onClick={onLogout}
                        title="Sign Out of PlaceMate AI"
                    >
                        <span>🚪</span>
                        <span className="logout-text">Sign Out</span>
                    </button>
                )}
            </div>
        </header>
    );
}

export default Navbar;