import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import Dashboard from "./dashboard";
import Documents from "./Documents";
import Profile from "./Profile";
import Jobs from "./Jobs";
import GovernmentExams from "./GovernmentExams";
import CareerAIMentor from "./CareerAIMentor";
import AICareerChatbot from "./AICareerChatbot";
import CareerAlerts from "./CareerAlerts";

import { API } from "../config";

function MainLayout({ user, onLogout }) {
    const [activePage, setActivePage] = useState("Dashboard");
    const [currentUser, setCurrentUser] = useState(user || {});

    // Automatically load full name from profile on startup if not already in user object
    useEffect(() => {
        async function fetchUserProfileName() {
            try {
                const res = await fetch(`${API}/profile`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile?.full_name) {
                        setCurrentUser((prev) => ({
                            ...prev,
                            fullName: data.profile.full_name
                        }));
                    }
                }
            } catch (err) {
                console.log("Profile name load notice:", err);
            }
        }
        fetchUserProfileName();
    }, []);

    const [targetCompany, setTargetCompany] = useState("");
    const [targetRole, setTargetRole] = useState("");

    // Callback when user updates their profile in Profile.jsx
    const handleProfileUpdate = (updatedProfile) => {
        if (updatedProfile?.full_name) {
            setCurrentUser((prev) => ({
                ...prev,
                fullName: updatedProfile.full_name
            }));
        }
    };

    const handleStartMockTest = (companyName, roleTitle) => {
        if (companyName) setTargetCompany(companyName);
        if (roleTitle) setTargetRole(roleTitle);
        setActivePage("Mock Tests");
    };

    const handleStartInterview = (companyName, roleTitle) => {
        if (companyName) setTargetCompany(companyName);
        if (roleTitle) setTargetRole(roleTitle);
        setActivePage("AI Interviewer");
    };

    return (
        <div className="app-layout">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                user={currentUser}
                onLogout={onLogout}
            />

            <div className="main-content">
                <Navbar
                    activePage={activePage}
                    user={currentUser}
                    onLogout={onLogout}
                />

                <main className="content-container">
                    {activePage === "Dashboard" && (
                        <Dashboard
                            setActivePage={setActivePage}
                            user={currentUser}
                        />
                    )}

                    {activePage === "Documents" && (
                        <Documents
                            setActivePage={setActivePage}
                        />
                    )}

                    {activePage === "Profile" && (
                        <Profile
                            setActivePage={setActivePage}
                            onProfileUpdate={handleProfileUpdate}
                        />
                    )}

                    {activePage === "Jobs" && (
                        <Jobs
                            setActivePage={setActivePage}
                            onStartMockTest={handleStartMockTest}
                            onStartInterview={handleStartInterview}
                            onPrepareCompany={handleStartMockTest}
                        />
                    )}

                    {activePage === "Government Exams" && (
                        <GovernmentExams
                            setActivePage={setActivePage}
                        />
                    )}

                    {activePage === "Mock Tests" && (
                        <CareerAIMentor
                            initialTab="mock-test"
                            initialCompany={targetCompany}
                            initialRole={targetRole}
                            setActivePage={setActivePage}
                        />
                    )}

                    {activePage === "AI Interviewer" && (
                        <CareerAIMentor
                            initialTab="interview"
                            initialCompany={targetCompany}
                            initialRole={targetRole}
                            setActivePage={setActivePage}
                        />
                    )}

                    {activePage === "AI Assistant" && (
                        <AICareerChatbot
                            user={currentUser}
                            setActivePage={setActivePage}
                            onStartMockTest={handleStartMockTest}
                            onStartInterview={handleStartInterview}
                        />
                    )}

                    {activePage === "Notifications" && (
                        <CareerAlerts
                            onStartMockTest={handleStartMockTest}
                            onStartInterview={handleStartInterview}
                            setActivePage={setActivePage}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;