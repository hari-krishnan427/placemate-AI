function Navbar({ activePage, user, onLogout }) {
    const displayName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Student");
    const userInitial = displayName.charAt(0).toUpperCase();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <h2 className="navbar-title">{activePage}</h2>
                <span className="navbar-tagline">DocMind AI Career Intelligence</span>
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
                        title="Sign Out of DocMind AI"
                    >
                        <span>🚪</span>
                        <span>Sign Out</span>
                    </button>
                )}
            </div>
        </header>
    );
}

export default Navbar;