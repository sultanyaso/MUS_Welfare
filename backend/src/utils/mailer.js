import nodemailer from 'nodemailer';

// ── Transporter ──────────────────────────────────────────────
// Uses Gmail SMTP. In .env set EMAIL_USER and EMAIL_PASS (App Password).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail App Password (not your real password)
  },
});

// ── Send Email Verification Link ─────────────────────────────
export async function sendVerificationEmail(toEmail, fullName, verifyToken) {
  const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000' ||'https://mus-welfare.vercel.app';
  const link = `${BASE_URL}/api/auth/verify-email?token=${verifyToken}`;

  await transporter.sendMail({
    from: `"MUS Welfare" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Verify your MUS Welfare account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#1a237e;">MUS Welfare Association</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Thank you for registering! Please click the button below to verify your email address.</p>
        <p>This confirms you are a <strong>real Gmail account holder</strong>. Unverified accounts cannot log in.</p>
        <a href="${link}"
           style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1a237e;color:#fff;text-decoration:none;border-radius:6px;font-size:15px;">
          Verify My Email
        </a>
        <p style="color:#888;font-size:12px;">If you did not create this account, simply ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:11px;">MUS Welfare Association — automated email, do not reply.</p>
      </div>
    `,
  });
}

// ── Send Congratulations Email on Login ──────────────────────
export async function sendCongratsEmail(toEmail, fullName) {
  await transporter.sendMail({
    from: `"MUS Welfare" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🎉 Welcome back to MUS Welfare!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;padding:32px;">
        <h2 style="color:#1a237e;">MUS Welfare Association</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p style="font-size:18px;">🎉 <strong>Congratulations!</strong></p>
        <p>You have successfully logged in to your MUS Welfare account. We're glad to have you back!</p>
        <p>Your account is <strong>verified and active</strong>. Enjoy full access to all member benefits.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:11px;">MUS Welfare Association — automated email, do not reply.</p>
      </div>
    `,
  });
}
// ── Send Announcement Email Blast ─────────────────────────────
// members = array of { email, fullName }
// announcement = Announcement document
export async function sendAnnouncementEmail(members, announcement) {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  const categoryLabel = {
    general: '📢 General Announcement',
    meeting: '📅 Meeting Notice',
    urgent:  '🚨 Urgent Notice',
    event:   '🎉 Event',
  }[announcement.category] || '📢 Announcement';

  const categoryColor = {
    general: '#1a4a24',
    meeting: '#1a237e',
    urgent:  '#b71c1c',
    event:   '#e65100',
  }[announcement.category] || '#1a4a24';

  const meetingBlock = announcement.meetingLink ? `
    <div style="margin:20px 0;padding:16px 20px;background:#e8f5e9;border-left:4px solid #2d6a3f;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#1a4a24;font-size:14px;">📅 Google Meet Details</p>
      ${announcement.meetingDate
        ? `<p style="margin:0 0 6px;font-size:13px;color:#333;">📆 Date &amp; Time: ${new Date(announcement.meetingDate).toLocaleString('en-PK', { dateStyle:'full', timeStyle:'short' })}</p>`
        : ''}
      ${announcement.meetingNote
        ? `<p style="margin:0 0 10px;font-size:13px;color:#555;">${announcement.meetingNote}</p>`
        : ''}
      <a href="${announcement.meetingLink}"
         style="display:inline-block;padding:10px 22px;background:#1a4a24;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:700;">
        Join Google Meet
      </a>
    </div>
  ` : '';

  const promises = members.map(({ email, fullName }) =>
    transporter.sendMail({
      from:    `"MUS Welfare" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: `[MUS Welfare] ${announcement.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
          <div style="background:${categoryColor};padding:24px 28px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.7);text-transform:uppercase;">${categoryLabel}</p>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">${announcement.title}</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 6px;font-size:14px;color:#333;">Dear <strong>${fullName}</strong>,</p>
            <div style="font-size:14px;color:#333;line-height:1.7;white-space:pre-line;margin:16px 0;">${announcement.body}</div>
            ${meetingBlock}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="font-size:12px;color:#888;margin:0;">Posted by MUS Welfare Admin</p>
            <p style="font-size:12px;color:#aaa;margin:8px 0 0;">
              View in dashboard: <a href="${FRONTEND_URL}" style="color:#1a4a24;">${FRONTEND_URL}</a>
            </p>
          </div>
        </div>
      `,
    })
  );

  await Promise.allSettled(promises);
}