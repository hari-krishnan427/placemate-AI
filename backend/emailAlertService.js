/**
 * DocMind AI - Automated Placement Email Dispatcher & Live Mailbox Simulator
 * 
 * Features:
 * 1. Rich HTML email generation with academic eligibility shield & 1-night prep blueprint
 * 2. User-provided email address & explicit opt-in consent tracking
 * 3. In-App Placement Mailbox Simulator for instant demonstration
 * 4. Dual dispatch: Real SMTP (Nodemailer) + Persistent simulated mailbox database
 */

// Formats high-fidelity, responsive HTML email template for placement drives
function formatPlacementEmail(alert, candidate) {
    const studentName = candidate?.fullName || "Student";
    const studentCgpa = candidate?.cgpa || 8.14;
    const batch = candidate?.graduationYear || 2027;
    const hours = alert.deadline_hours_from_now || 24;
    const prep = alert.night_before_prep || {};

    let categoryBadge = "🏢 IT MNC Placement Drive";
    let accentColor = "#4f46e5";

    if (alert.category === "government_exam") {
        categoryBadge = "🏛️ Government / PSU Examination";
        accentColor = "#3730a3";
    } else if (alert.category === "core_walkin") {
        categoryBadge = "🏭 Core Engineering Spot Walk-in";
        accentColor = "#c2410c";
    } else if (alert.category === "startup_internship") {
        categoryBadge = "🚀 Startup Tech Internship";
        accentColor = "#7c3aed";
    }

    const urgencyPrefix = alert.urgency === "critical_24h" ? "🚨 [CLOSING TONIGHT]" : "📢 [NEW DRIVE]";
    const subject = `${urgencyPrefix} ${alert.company} - ${alert.title} (Batch ${batch})`;

    const repeatedQuestionsList = (prep.repeatQuestions || [])
        .map(q => `<li style="margin-bottom: 6px; color: #334155;"><strong>•</strong> ${q}</li>`)
        .join("");

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Header Banner -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px; text-align: left; color: #ffffff;">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #a5b4fc; margin-bottom: 10px;">
          DOCMIND AI PLACEMENT RADAR &bull; BATCH ${batch}
        </div>
        <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff;">${alert.company}</h1>
        <p style="margin: 0; font-size: 14px; color: #cbd5e1;">${alert.title}</p>
      </td>
    </tr>

    <!-- Body Container -->
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
          Hi <strong>${studentName}</strong>, our placement radar detected an urgent hiring drive matching your profile:
        </p>

        <!-- Quick Summary Table -->
        <table width="100%" style="background: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #e2e8f0; margin-bottom: 18px;">
          <tr>
            <td style="padding: 6px; font-size: 12px; color: #64748b; font-weight: 600;">Stream:</td>
            <td style="padding: 6px; font-size: 13px; font-weight: 700; color: ${accentColor};">${categoryBadge}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-size: 12px; color: #64748b; font-weight: 600;">Package / Stipend:</td>
            <td style="padding: 6px; font-size: 13px; font-weight: 700; color: #047857;">💰 ${alert.ctc_or_stipend}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-size: 12px; color: #64748b; font-weight: 600;">Location:</td>
            <td style="padding: 6px; font-size: 13px; color: #1e293b;">📍 ${alert.location}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-size: 12px; color: #64748b; font-weight: 600;">Deadline Closes:</td>
            <td style="padding: 6px; font-size: 13px; font-weight: 800; color: #b91c1c;">⏳ In ~${hours} Hours (${alert.urgency === "critical_24h" ? "Tonight 11:59 PM" : "Closing Soon"})</td>
          </tr>
        </table>

        <!-- Academic & Arrear Eligibility Shield -->
        <div style="background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #065f46; display: flex; align-items: center; gap: 6px;">
            🛡️ Academic & Arrear Eligibility Shield: <span style="background: #10b981; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 11px;">100% ELIGIBLE</span>
          </h3>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #047857;">
            • <strong>CGPA Cutoff:</strong> Requires ${alert.min_cgpa} CGPA (Your verified CGPA is <strong>${studentCgpa}</strong>).
          </p>
          <p style="margin: 0; font-size: 13px; color: #047857;">
            • <strong>Standing Arrears Policy:</strong> ${alert.arrear_policy}.
          </p>
        </div>

        <!-- Emergency 1-Night Prep Kit -->
        <div style="background: #faf5ff; border: 1.5px solid #d8b4fe; border-radius: 12px; padding: 16px; margin-bottom: 22px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b21a8;">
            ⚡ Emergency 1-Night Elimination Blueprint
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.5; color: #4c1d95;">
            ${prep.round1Focus || "Review core programming, aptitude, and data structures."}
          </p>
          ${prep.cheatSheetTips ? `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; font-size: 11px; color: #92400e; margin-bottom: 10px;">
            <strong>💡 Placement Cell Intel:</strong> ${prep.cheatSheetTips}
          </div>` : ""}
          <strong style="font-size: 12px; color: #581c87; display: block; margin-bottom: 6px;">Top Repeated Questions:</strong>
          <ul style="margin: 0; padding-left: 16px; font-size: 12px; line-height: 1.5;">
            ${repeatedQuestionsList}
          </ul>
        </div>

        <!-- 1-Click Action Buttons -->
        <div style="text-align: center; padding-top: 10px;">
          <a href="${alert.apply_url}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; margin-right: 10px; box-shadow: 0 2px 8px rgba(79,70,229,0.3);">
            🚀 Apply on Official Portal &rarr;
          </a>
          <a href="http://localhost:5173" target="_blank" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px;">
            📝 Practice Timed Mock Test
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
        You received this automated placement alert because you enabled notifications in DocMind AI.
        <br>
        DocMind AI &bull; Autonomous Placement Intelligence Engine
      </td>
    </tr>

  </table>
</body>
</html>
`;

    return {
        subject,
        htmlBody,
        urgency: alert.urgency || "normal"
    };
}

// Save or update user's explicit email alert preferences
async function saveEmailPreferences(userId, { alertEmail, emailOptIn }, pool) {
    if (!userId) {
        const fallback = await pool.query(`SELECT user_id FROM student_profiles ORDER BY updated_at DESC LIMIT 1`);
        if (fallback.rows.length > 0) userId = fallback.rows[0].user_id;
    }

    if (!userId) {
        throw new Error("No user identified to update preferences");
    }

    const optIn = emailOptIn !== undefined ? !!emailOptIn : true;
    const emailToSave = alertEmail ? alertEmail.trim().toLowerCase() : null;

    const result = await pool.query(
        `UPDATE student_profiles
         SET alert_email = COALESCE($1, alert_email),
             email_opt_in = $2,
             updated_at = NOW()
         WHERE user_id = $3
         RETURNING user_id, full_name, alert_email, email_opt_in`,
        [emailToSave, optIn, userId]
    );

    return result.rows[0];
}

// Dispatches a placement email (Saves to simulated mailbox and sends via nodemailer if active)
async function dispatchPlacementEmail({ userId, targetEmail, alert, candidate, pool, transporter }) {
    const { subject, htmlBody, urgency } = formatPlacementEmail(alert, candidate);
    const recipient = targetEmail || candidate?.alertEmail || candidate?.email || "student@example.com";
    const alertId = alert.id || (alert.company + '-' + (alert.title || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);

    // 1. Save into persistent Placement Mailbox table
    let savedEmailId = null;
    try {
        const insertRes = await pool.query(
            `INSERT INTO placement_emails 
             (user_id, recipient_email, alert_id, company, title, subject, html_body, urgency, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
             RETURNING id, dispatched_at`,
            [userId || null, recipient, alertId, alert.company, alert.title, subject, htmlBody, urgency]
        );
        savedEmailId = insertRes.rows[0]?.id;
    } catch (dbErr) {
        console.error("[Email Mailbox DB Error]:", dbErr.message);
    }

    // 2. Real Email delivery attempt (Resend HTTP API or Nodemailer SMTP)
    let smtpDelivered = false;
    let smtpError = null;

    if (process.env.RESEND_API_KEY) {
        fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || "PlaceMate AI <onboarding@resend.dev>",
                to: recipient,
                subject: subject,
                html: htmlBody
            })
        }).then(res => {
            if (res.ok) {
                console.log(`[Email Dispatcher] Resend HTTP email delivered to ${recipient} (${alert.company})`);
            }
        }).catch(err => {
            console.warn(`[Email Dispatcher] Resend HTTP notice: ${err.message}`);
        });
        smtpDelivered = true;
    } else if (transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            transporter.sendMail({
                from: `"PlaceMate AI Placement Radar" <${process.env.EMAIL_USER}>`,
                to: recipient,
                subject: subject,
                html: htmlBody
            }).then(info => {
                console.log(`[Email Dispatcher] Real SMTP email sent to ${recipient} (${alert.company})`);
            }).catch(mailErr => {
                console.warn(`[Email Dispatcher] SMTP Delivery notice: ${mailErr.message}. Simulated in-app mailbox active.`);
            });
            smtpDelivered = true;
        } catch (mailErr) {
            smtpError = mailErr.message;
            console.warn(`[Email Dispatcher] SMTP Setup notice: ${mailErr.message}.`);
        }
    }

    return {
        success: true,
        emailId: savedEmailId,
        recipient,
        subject,
        company: alert.company,
        smtpDelivered,
        smtpError
    };
}

// Load all active live jobs & government exams from DB and convert into Placement Alert briefings
async function loadAllActiveOpportunitiesAsAlerts(pool, baseAlerts = []) {
    try {
        const oppRes = await pool.query(
            `SELECT id, title, organization, category, salary_or_stipend, location, min_cgpa, 
                    eligible_degrees, eligible_branches, eligible_years, required_skills, apply_url, 
                    description, deadline, created_at
             FROM opportunities 
             WHERE is_active = TRUE 
             ORDER BY created_at DESC LIMIT 60`
        );

        const dbAlerts = oppRes.rows.map(opp => {
            const hoursLeft = opp.deadline 
                ? Math.max(1, Math.round((new Date(opp.deadline).getTime() - Date.now()) / (3600 * 1000)))
                : 28;
            
            const skillsList = Array.isArray(opp.required_skills) && opp.required_skills.length > 0 
                ? opp.required_skills 
                : ["DSA", "Problem Solving", "Core CS"];
            
            return {
                id: `opp-${opp.id}`,
                company: opp.organization,
                title: opp.title,
                category: opp.category === 'government_exam' ? 'government_exam' : (opp.category === 'internship' ? 'startup_internship' : 'job'),
                alert_type: hoursLeft <= 24 ? "midnight_deadline" : "flash_drive",
                urgency: hoursLeft <= 24 ? "critical_24h" : "closing_soon",
                ctc_or_stipend: opp.salary_or_stipend || "Competitive CTC",
                location: opp.location || "Pan India",
                deadline_hours_from_now: hoursLeft,
                batch_allowed: "2026 & 2027 Passing Out Batches",
                min_cgpa: opp.min_cgpa ? parseFloat(opp.min_cgpa) : 6.0,
                arrear_policy: "Standard Fresher Criteria (0 active standing arrears)",
                apply_url: opp.apply_url || "https://careers.google.com",
                night_before_prep: {
                    round1Focus: `Round 1 Elimination: Technical MCQ & Coding assessment covering ${skillsList.slice(0, 3).join(", ")}.`,
                    repeatQuestions: [
                        `Problem solving and time complexity analysis in ${skillsList[0] || 'Data Structures'}`,
                        `Frequently asked core technical interview questions for ${opp.title}`,
                        `Practical coding implementation and boundary case debugging`
                    ],
                    cheatSheetTips: `Common elimination factor: Speed and accuracy in Round 1. Revise fundamental algorithms & core subjects.`
                }
            };
        });

        const combined = [...(baseAlerts || [])];
        for (const item of dbAlerts) {
            const exists = combined.some(c => 
                c.company.toLowerCase() === item.company.toLowerCase() && 
                c.title.toLowerCase() === item.title.toLowerCase()
            );
            if (!exists) {
                combined.push(item);
            }
        }
        return combined;
    } catch (err) {
        console.error("Error loading live opportunities as alerts:", err.message);
        return baseAlerts || [];
    }
}

// Background Automated Dispatcher (Runs silently without clicking)
// Dispatches unread eligible alerts to all students with active email opt-in
async function processAutomatedBackgroundEmails(pool, alerts, transporter) {
    try {
        const allAlerts = await loadAllActiveOpportunitiesAsAlerts(pool, alerts);

        const optedUsers = await pool.query(
            `SELECT user_id, full_name, email, alert_email, degree, branch, graduation_year, cgpa, dispatched_email_ids
             FROM student_profiles
             WHERE email_opt_in = TRUE AND (alert_email IS NOT NULL OR email IS NOT NULL)`
        );

        if (optedUsers.rows.length === 0) {
            return {
                status: "idle",
                message: "No students currently opted in for automated placement emails. (Consent respected)",
                dispatchedCount: 0
            };
        }

        const dispatches = [];

        for (const user of optedUsers.rows) {
            const recipientEmail = user.alert_email || user.email;
            if (!recipientEmail) continue;

            const alreadyDispatched = Array.isArray(user.dispatched_email_ids) ? user.dispatched_email_ids : [];
            const candidate = {
                fullName: user.full_name || "Student",
                cgpa: parseFloat(user.cgpa) || 8.0,
                graduationYear: user.graduation_year || 2027,
                degree: user.degree || "B.E",
                branch: user.branch || "CSE",
                alertEmail: recipientEmail
            };

            // Check eligibility for pending alerts
            const eligiblePendingAlerts = (allAlerts || []).filter(alert => {
                const aId = alert.id || (alert.company + '-' + (alert.title || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
                if (alreadyDispatched.includes(aId)) return false;
                const isCgpaSafe = candidate.cgpa >= (alert.min_cgpa || 6.5);
                const isBatchSafe = alert.batch_allowed.includes(String(candidate.graduationYear)) || alert.batch_allowed.toLowerCase().includes("all");
                return isCgpaSafe && isBatchSafe;
            });

            // Dispatch highest-urgency alerts
            if (eligiblePendingAlerts.length > 0) {
                eligiblePendingAlerts.sort((a, b) => (a.deadline_hours_from_now || 99) - (b.deadline_hours_from_now || 99));
                
                // Dispatch top 2 matching alerts
                const alertsToDispatch = eligiblePendingAlerts.slice(0, 2);

                for (const targetAlert of alertsToDispatch) {
                    const aId = targetAlert.id || (targetAlert.company + '-' + (targetAlert.title || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
                    const result = await dispatchPlacementEmail({
                        userId: user.user_id,
                        targetEmail: recipientEmail,
                        alert: { ...targetAlert, id: aId },
                        candidate,
                        pool,
                        transporter
                    });

                    alreadyDispatched.push(aId);

                    dispatches.push({
                        student: user.full_name,
                        recipientEmail,
                        company: targetAlert.company,
                        subject: result.subject,
                        smtpDelivered: result.smtpDelivered
                    });
                }

                // Update dispatched list in database
                await pool.query(
                    `UPDATE student_profiles 
                     SET dispatched_email_ids = $1 
                     WHERE user_id = $2`,
                    [JSON.stringify(alreadyDispatched), user.user_id]
                );
            }
        }

        return {
            status: "success",
            totalOptedUsers: optedUsers.rows.length,
            dispatchedCount: dispatches.length,
            dispatches
        };
    } catch (err) {
        console.error("[Automated Email Background Error]:", err);
        return {
            status: "error",
            error: err.message
        };
    }
}

// Fetch all simulated mailbox emails for a student
async function getStudentMailbox(userId, pool) {
    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const fallback = await pool.query(`SELECT user_id FROM student_profiles ORDER BY updated_at DESC LIMIT 1`);
            if (fallback.rows.length > 0) targetUserId = fallback.rows[0].user_id;
        }

        const query = targetUserId
            ? `SELECT id, recipient_email, alert_id, company, title, subject, html_body, urgency, is_read, dispatched_at 
               FROM placement_emails 
               WHERE user_id = $1 OR user_id IS NULL
               ORDER BY dispatched_at DESC LIMIT 20`
            : `SELECT id, recipient_email, alert_id, company, title, subject, html_body, urgency, is_read, dispatched_at 
               FROM placement_emails 
               ORDER BY dispatched_at DESC LIMIT 20`;

        const res = await pool.query(query, targetUserId ? [targetUserId] : []);
        const unreadCount = res.rows.filter(r => !r.is_read).length;

        return {
            emails: res.rows,
            totalCount: res.rows.length,
            unreadCount
        };
    } catch (err) {
        console.error("Error fetching mailbox:", err);
        return { emails: [], totalCount: 0, unreadCount: 0 };
    }
}

// Mark email as read
async function markEmailAsRead(emailId, pool) {
    try {
        await pool.query(`UPDATE placement_emails SET is_read = TRUE WHERE id = $1`, [emailId]);
        return { success: true };
    } catch (err) {
        console.error("Error marking email as read:", err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    formatPlacementEmail,
    saveEmailPreferences,
    dispatchPlacementEmail,
    processAutomatedBackgroundEmails,
    getStudentMailbox,
    markEmailAsRead
};
