import MainLayout from "./mainlayout";
import { useEffect, useState } from "react";

import { API } from "../config";

function Login() {
    // ==================================================
    // SCREEN STATE
    // ==================================================
    const [screen, setScreen] = useState("login"); // 'login', 'register', 'verify-otp', 'create-password', 'reset-password', 'forgot-password', 'main'

    // ==================================================
    // USER DATA
    // ==================================================
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ==================================================
    // OTP
    // ==================================================
    const [otpPurpose, setOtpPurpose] = useState("register");
    const [resendCooldown, setResendCooldown] = useState(0);

    // ==================================================
    // UI FEEDBACK
    // ==================================================
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);

    // ==================================================
    // CHECK EXISTING SESSION ON MOUNT
    // ==================================================
    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch(`${API}/auth/me`, {
                    credentials: "include"
                });

                if (response.ok) {
                    const data = await response.json();
                    setEmail(data.user.email);
                    setUserData(data.user);
                    setScreen("main");
                }
            } catch (error) {
                console.log("Session check notice:", error);
            }
        }
        checkSession();
    }, []);

    // ==================================================
    // RESEND OTP COUNTDOWN
    // ==================================================
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown(resendCooldown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ==================================================
    // SEND OTP
    // ==================================================
    async function handleSendOTP(purpose) {
        if (!email || !email.includes("@")) {
            setMessage("Please enter a valid college or personal email address");
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setIsError(false);
        setOtpPurpose(purpose);

        try {
            const response = await fetch(`${API}/auth/send-otp`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, purpose })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Failed to send verification code");
                setIsError(true);
                return;
            }

            setScreen("verify-otp");
            setResendCooldown(data.cooldown || 30);
            if (data.fallbackOtp) {
                setOtp(data.fallbackOtp);
                setMessage(`Verification Code: ${data.fallbackOtp} (Host SMTP offline - backup code ready)`);
            } else {
                setOtp("");
                setMessage(`Verification code sent to ${email}. Check your inbox!`);
            }
            setIsError(false);
        } catch (error) {
            console.error("OTP send error:", error);
            setMessage("Unable to connect to PlaceMate backend server");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // VERIFY OTP
    // ==================================================
    async function handleVerifyOTP() {
        if (!otp || otp.trim().length < 6) {
            setMessage("Please enter the complete 6-digit OTP");
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(`${API}/auth/verify-otp`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp: otp.trim(),
                    purpose: otpPurpose
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Invalid or expired OTP");
                setIsError(true);
                return;
            }

            if (otpPurpose === "register") {
                setScreen("create-password");
            } else {
                setScreen("reset-password");
            }
            setMessage("Email verified successfully! Now create your secure password.");
            setIsError(false);
        } catch (error) {
            console.error("OTP verify error:", error);
            setMessage("Unable to connect to backend");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // RESEND OTP
    // ==================================================
    async function handleResendOTP() {
        if (resendCooldown > 0) return;
        await handleSendOTP(otpPurpose);
    }

    // ==================================================
    // CREATE ACCOUNT
    // ==================================================
    async function handleCreateAccount(e) {
        if (e) e.preventDefault();

        if (password.length < 8) {
            setMessage("Password must contain at least 8 characters");
            setIsError(true);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(`${API}/auth/register`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not complete account setup");
                setIsError(true);
                return;
            }

            setPassword("");
            setConfirmPassword("");
            setOtp("");
            setScreen("login");
            setMessage("Account created successfully! You can now log in.");
            setIsError(false);
        } catch (error) {
            console.error("Account creation error:", error);
            setMessage("Unable to connect to backend");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // LOGIN
    // ==================================================
    async function handleLogin(e) {
        if (e) e.preventDefault();

        if (!email || !password) {
            setMessage("Both email and password are required");
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(`${API}/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Invalid email or password");
                setIsError(true);
                return;
            }

            setUserData(data.user);
            setScreen("main");
            setMessage("");
        } catch (error) {
            console.error("Login error:", error);
            setMessage("Unable to connect to backend server");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // 1-CLICK INSTANT DEMO LOGIN (FRICTIONLESS ACCESS)
    // ==================================================
    async function handleDemoInstantLogin() {
        setLoading(true);
        setMessage("Signing in with verified demo student profile...");
        setIsError(false);
        setEmail("student.demo@placemate.ai");
        setPassword("placemate2026");

        try {
            const response = await fetch(`${API}/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "student.demo@placemate.ai",
                    password: "placemate2026"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Demo login failed");
                setIsError(true);
                return;
            }

            setUserData(data.user);
            setScreen("main");
            setMessage("");
        } catch (error) {
            console.error("Instant demo login error:", error);
            setMessage("Unable to connect to backend server");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // FORGOT PASSWORD
    // ==================================================
    function openForgotPassword() {
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setMessage("");
        setIsError(false);
        setScreen("forgot-password");
    }

    // ==================================================
    // RESET PASSWORD
    // ==================================================
    async function handleResetPassword(e) {
        if (e) e.preventDefault();

        if (password.length < 8) {
            setMessage("Password must contain at least 8 characters");
            setIsError(true);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(`${API}/auth/reset-password`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not update password");
                setIsError(true);
                return;
            }

            setPassword("");
            setConfirmPassword("");
            setOtp("");
            setScreen("login");
            setMessage("Password updated successfully! Please sign in with your new password.");
            setIsError(false);
        } catch (error) {
            console.error("Password reset error:", error);
            setMessage("Unable to connect to backend");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // LOGOUT
    // ==================================================
    async function handleLogout() {
        try {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setUserData(null);
        setScreen("login");
        setMessage("Signed out successfully.");
        setIsError(false);
    }

    // ==================================================
    // RENDER MAIN APPLICATION LAYOUT
    // ==================================================
    if (screen === "main") {
        return <MainLayout user={userData} onLogout={handleLogout} />;
    }

    // ==================================================
    // RENDER AUTHENTICATION PORTAL
    // ==================================================
    return (
        <div className="auth-fullscreen-container">
            {/* Ambient Lighting Orbs */}
            <div className="auth-ambient-glow orb-1"></div>
            <div className="auth-ambient-glow orb-2"></div>
            <div className="auth-ambient-glow orb-3"></div>

            <div className="auth-centered-wrapper">
                <div className="auth-card-panel auth-card-centered">
                    {/* Centered Brand Header */}
                    <div className="auth-centered-brand-header">
                        <div className="auth-brand-logo-badge">
                            <span className="brand-logo-emoji">🧠</span>
                        </div>
                        <h1 className="auth-brand-name">PlaceMate AI</h1>
                        <p className="auth-brand-subtitle">Placement Intelligence Platform</p>
                    </div>

                    {/* Tab Switcher for Login / Register */}
                    {(screen === "login" || screen === "register") && (
                        <div className="auth-tab-bar">
                            <button
                                type="button"
                                className={`auth-tab-btn ${screen === "login" ? "active" : ""}`}
                                onClick={() => {
                                    setMessage("");
                                    setIsError(false);
                                    setScreen("login");
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                className={`auth-tab-btn ${screen === "register" ? "active" : ""}`}
                                onClick={() => {
                                    setMessage("");
                                    setIsError(false);
                                    setScreen("register");
                                }}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {/* Status / Error / Success Alert Banner */}
                    {message && (
                        <div className={`auth-alert-banner ${isError ? "alert-error" : "alert-success"}`}>
                            <span className="alert-icon">{isError ? "⚠️" : "✅"}</span>
                            <span className="alert-text">{message}</span>
                        </div>
                    )}

                    {/* SCREEN 1: LOGIN */}
                    {screen === "login" && (
                        <div className="auth-form-content">
                            {/* Instant 1-Click Demo Login Banner */}
                            <div className="auth-demo-shortcut-bar">
                                <button
                                    type="button"
                                    className="btn-demo-quick-login"
                                    onClick={handleDemoInstantLogin}
                                    disabled={loading}
                                    title="Instant access with pre-configured student profile"
                                >
                                    <span className="demo-icon">⚡</span>
                                    <span className="demo-btn-title">1-Click Instant Demo</span>
                                </button>
                            </div>

                            <div className="auth-divider-line">
                                <span>or sign in with email</span>
                            </div>

                            <form onSubmit={handleLogin} className="auth-form-element">
                                <div className="auth-input-group">
                                    <label className="auth-input-label">Email</label>
                                    <div className="auth-input-wrapper">
                                        <span className="input-prefix-icon">✉️</span>
                                        <input
                                            type="email"
                                            className="auth-text-input"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="auth-input-group">
                                    <div className="auth-label-row">
                                        <label className="auth-input-label">Password</label>
                                        <button
                                            type="button"
                                            className="auth-link-subtle"
                                            onClick={openForgotPassword}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="auth-input-wrapper">
                                        <span className="input-prefix-icon">🔒</span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="auth-text-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="input-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? "👁️" : "🙈"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-auth-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="btn-spinner-content">
                                            <span className="spinner-mini"></span> Signing in...
                                        </span>
                                    ) : (
                                        <span>Sign In</span>
                                    )}
                                </button>
                            </form>

                            <div className="auth-card-bottom-prompt">
                                <span>Don't have an account?</span>
                                <button
                                    type="button"
                                    className="auth-inline-link"
                                    onClick={() => {
                                        setMessage("");
                                        setIsError(false);
                                        setScreen("register");
                                    }}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}

                        {/* SCREEN 2: REGISTER (EMAIL FIRST) */}
                        {screen === "register" && (
                            <div className="auth-form-content">
                                <div className="auth-card-header">
                                    <h2 className="auth-card-title">Join PlaceMate AI</h2>
                                    <p className="auth-card-desc">
                                        Enter your email to receive a secure 6-digit verification code.
                                    </p>
                                </div>

                                <div className="auth-form-element">
                                    <div className="auth-input-group">
                                        <label className="auth-input-label">College or Personal Email</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">✉️</span>
                                            <input
                                                type="email"
                                                className="auth-text-input"
                                                placeholder="e.g. rahul@annauniv.edu or rahul@gmail.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-auth-primary"
                                        onClick={() => handleSendOTP("register")}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="btn-spinner-content">
                                                <span className="spinner-mini"></span> Sending Code...
                                            </span>
                                        ) : (
                                            <span>Send Verification Code →</span>
                                        )}
                                    </button>
                                </div>

                                <div className="auth-card-bottom-prompt">
                                    <span>Already have an account?</span>
                                    <button
                                        type="button"
                                        className="auth-inline-link"
                                        onClick={() => {
                                            setMessage("");
                                            setIsError(false);
                                            setScreen("login");
                                        }}
                                    >
                                        Sign in instead
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SCREEN 3: VERIFY OTP */}
                        {screen === "verify-otp" && (
                            <div className="auth-form-content">
                                <div className="auth-card-header">
                                    <div className="auth-badge-pill">Verification Step</div>
                                    <h2 className="auth-card-title">Verify Your Email</h2>
                                    <p className="auth-card-desc">
                                        Please enter the 6-digit security code sent to <strong>{email}</strong>
                                    </p>
                                </div>

                                <div className="auth-form-element">
                                    <div className="auth-input-group">
                                        <label className="auth-input-label">6-Digit Verification Code</label>
                                        <div className="auth-otp-input-wrapper">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className="auth-otp-input"
                                                placeholder="••••••"
                                                maxLength="6"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-auth-primary"
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otp.length < 6}
                                    >
                                        {loading ? (
                                            <span className="btn-spinner-content">
                                                <span className="spinner-mini"></span> Verifying Code...
                                            </span>
                                        ) : (
                                            <span>Verify & Continue →</span>
                                        )}
                                    </button>

                                    <div className="auth-resend-row">
                                        {resendCooldown > 0 ? (
                                            <span className="resend-cooldown-text">
                                                ⏳ Resend available in <strong>{resendCooldown}s</strong>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-resend-text"
                                                onClick={handleResendOTP}
                                                disabled={loading}
                                            >
                                                🔄 Resend verification code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-auth-secondary"
                                        onClick={() => {
                                            setOtp("");
                                            setMessage("");
                                            setIsError(false);
                                            setScreen("login");
                                        }}
                                    >
                                        ← Change email / Back to Login
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SCREEN 4: CREATE PASSWORD */}
                        {screen === "create-password" && (
                            <div className="auth-form-content">
                                <div className="auth-card-header">
                                    <div className="auth-badge-pill">Account Setup</div>
                                    <h2 className="auth-card-title">Create Your Password</h2>
                                    <p className="auth-card-desc">
                                        Verified: <strong>{email}</strong>. Choose a password with at least 8 characters.
                                    </p>
                                </div>

                                <form onSubmit={handleCreateAccount} className="auth-form-element">
                                    <div className="auth-input-group">
                                        <label className="auth-input-label">New Password</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">🔒</span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="auth-text-input"
                                                placeholder="Create strong password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="input-eye-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? "👁️" : "🙈"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="auth-input-group">
                                        <label className="auth-input-label">Confirm Password</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">🔒</span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="auth-text-input"
                                                placeholder="Re-type password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="input-eye-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? "👁️" : "🙈"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-auth-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="btn-spinner-content">
                                                <span className="spinner-mini"></span> Creating Account...
                                            </span>
                                        ) : (
                                            <span>Complete Registration & Login →</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SCREEN 5: FORGOT PASSWORD */}
                        {screen === "forgot-password" && (
                            <div className="auth-form-content">
                                <div className="auth-card-header">
                                    <h2 className="auth-card-title">Reset Your Password</h2>
                                    <p className="auth-card-desc">
                                        Enter your registered email address. We'll send a password recovery code.
                                    </p>
                                </div>

                                <div className="auth-form-element">
                                    <div className="auth-input-group">
                                        <label className="auth-input-label">Registered Email</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">✉️</span>
                                            <input
                                                type="email"
                                                className="auth-text-input"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-auth-primary"
                                        onClick={() => handleSendOTP("reset")}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="btn-spinner-content">
                                                <span className="spinner-mini"></span> Sending Reset Code...
                                            </span>
                                        ) : (
                                            <span>Send Reset OTP →</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-auth-secondary"
                                        onClick={() => {
                                            setMessage("");
                                            setIsError(false);
                                            setScreen("login");
                                        }}
                                    >
                                        ← Back to Sign In
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SCREEN 6: RESET PASSWORD FORM */}
                        {screen === "reset-password" && (
                            <div className="auth-form-content">
                                <div className="auth-card-header">
                                    <div className="auth-badge-pill">Security Reset</div>
                                    <h2 className="auth-card-title">Set New Password</h2>
                                    <p className="auth-card-desc">
                                        OTP verified for <strong>{email}</strong>. Enter your new password below.
                                    </p>
                                </div>

                                <form onSubmit={handleResetPassword} className="auth-form-element">
                                    <div className="auth-input-group">
                                        <label className="auth-input-label">New Password</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">🔒</span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="auth-text-input"
                                                placeholder="Enter new password (min 8 chars)"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="input-eye-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? "👁️" : "🙈"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="auth-input-group">
                                        <label className="auth-input-label">Confirm New Password</label>
                                        <div className="auth-input-wrapper">
                                            <span className="input-prefix-icon">🔒</span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="auth-text-input"
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="input-eye-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? "👁️" : "🙈"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-auth-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="btn-spinner-content">
                                                <span className="spinner-mini"></span> Updating Password...
                                            </span>
                                        ) : (
                                            <span>Update Password & Login →</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
}

export default Login;