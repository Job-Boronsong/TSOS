import nodemailer from "nodemailer";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!host || !user || !pass) return null;
  return {
    transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }),
    from,
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-GH", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatGHS(amount: number): string {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendWelcomeEmail(opts: {
  schoolName: string;
  adminName: string;
  contactEmail: string;
  loginUrl: string;
  username: string;
  trialExpiry: string;
}) {
  const cfg = getTransporter();
  if (!cfg) return;

  const { schoolName, adminName, contactEmail, loginUrl, username, trialExpiry } = opts;

  const safeAdminName = escapeHtml(adminName);
  const safeSchoolName = escapeHtml(schoolName);
  const safeUsername = escapeHtml(username);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeTrialExpiry = escapeHtml(formatDate(trialExpiry));

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px">
      <div style="background:#1e40af;padding:28px 24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px">Welcome to TSOS!</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px">Torrential School Operations Suite</p>
      </div>

      <div style="background:#fff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none">
        <p style="font-size:15px;color:#374151;margin:0 0 8px">Dear <strong>${safeAdminName}</strong>,</p>

        <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6">
          Welcome to <strong>TSOS</strong>! Your school <strong>${safeSchoolName}</strong> has been successfully registered.
          Your 14-day free trial is now active — no credit card required.
        </p>

        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em">Your Login Details</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e3a5f">
            <tr>
              <td style="padding:6px 0;color:#64748b">Username</td>
              <td style="padding:6px 0;text-align:right;font-weight:600">${safeUsername}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b">Trial Expires</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#15803d">${safeTrialExpiry}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b">Login URL</td>
              <td style="padding:6px 0;text-align:right"><a href="${safeLoginUrl}" style="color:#1e40af;word-break:break-all">${safeLoginUrl}</a></td>
            </tr>
          </table>
        </div>

        <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.6">
          During your trial you have full access to all TSOS features — student management, attendance,
          finance, grades, teacher management, GPS check-in, and more.
        </p>

        <div style="text-align:center;margin:28px 0">
          <a href="${safeLoginUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:15px">Sign In to Your School</a>
        </div>

        <p style="font-size:14px;color:#6b7280;margin:24px 0 0;line-height:1.6">
          Questions? Reach us at <a href="mailto:info@torrentialtechnologies.com" style="color:#1e40af">info@torrentialtechnologies.com</a>.
        </p>

        <p style="font-size:14px;color:#374151;margin:24px 0 0">
          Warm regards,<br>
          <strong>The Torrential Technologies Team</strong>
        </p>
      </div>

      <div style="padding:14px 24px;text-align:center">
        <p style="font-size:11px;color:#9ca3af;margin:0">
          © ${new Date().getFullYear()} Torrential Technologies · TSOS Platform
        </p>
      </div>
    </div>
  `;

  try {
    await cfg.transporter.sendMail({
      from: `"TSOS Platform" <${cfg.from}>`,
      to: contactEmail,
      subject: `Welcome to TSOS — ${schoolName} is ready!`,
      html,
    });
  } catch (err) {
    console.error("[mailer] Failed to send welcome email:", err);
  }
}

export async function sendSubscriptionThankYou(opts: {
  schoolName: string;
  contactEmail: string;
  months: number;
  amount: number;
  newExpiry: string;
}) {
  const cfg = getTransporter();
  if (!cfg) return;

  const { schoolName, contactEmail, months, amount, newExpiry } = opts;
  const monthWord = months === 1 ? "1 month" : `${months} months`;

  const safeSchoolName = escapeHtml(schoolName);
  const safeMonthWord = escapeHtml(monthWord);
  const safeAmount = escapeHtml(formatGHS(amount));
  const safeExpiry = escapeHtml(formatDate(newExpiry));

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px">
      <div style="background:#1e40af;padding:28px 24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px">Torrential School Operations Suite</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px">TSOS — School Management Platform</p>
      </div>

      <div style="background:#fff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none">
        <p style="font-size:15px;color:#374151;margin:0 0 8px">Dear <strong>${safeSchoolName}</strong>,</p>

        <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6">
          Thank you for subscribing to <strong>TSOS</strong>! Your subscription has been activated and your
          school's account is ready to use.
        </p>

        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em">Subscription Details</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e3a5f">
            <tr>
              <td style="padding:6px 0;color:#64748b">Plan</td>
              <td style="padding:6px 0;text-align:right;font-weight:600">Standard — ${safeMonthWord}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b">Amount Paid</td>
              <td style="padding:6px 0;text-align:right;font-weight:600">${safeAmount}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b">Valid Until</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#15803d">${safeExpiry}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.6">
          You now have full access to all TSOS features including student management, attendance, finance,
          payroll, and more. Log in at any time to get started.
        </p>

        <p style="font-size:14px;color:#6b7280;margin:24px 0 0;line-height:1.6">
          If you have any questions or need assistance, please don't hesitate to reach out to us
          at <a href="mailto:info@torrentialtechnologies.com" style="color:#1e40af">info@torrentialtechnologies.com</a>.
        </p>

        <p style="font-size:14px;color:#374151;margin:24px 0 0">
          Warm regards,<br>
          <strong>The Torrential Technologies Team</strong>
        </p>
      </div>

      <div style="padding:14px 24px;text-align:center">
        <p style="font-size:11px;color:#9ca3af;margin:0">
          © ${new Date().getFullYear()} Torrential Technologies · TSOS Platform<br>
          You are receiving this because your school subscribed to TSOS.
        </p>
      </div>
    </div>
  `;

  try {
    await cfg.transporter.sendMail({
      from: `"TSOS Platform" <${cfg.from}>`,
      to: contactEmail,
      subject: `✅ Subscription Confirmed — ${schoolName} (${monthWord})`,
      html,
    });
  } catch (err) {
    console.error("[mailer] Failed to send subscription email:", err);
  }
}
