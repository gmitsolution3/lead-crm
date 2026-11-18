import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || `"GM Lead Gen" <${smtpUser}>`;
const appName = process.env.APP_NAME || "GM Lead Gen";

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export interface PasswordResetEmailOptions {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Generates an elegant, responsive HTML email template for password reset.
 */
function getPasswordResetHtml({ name, resetUrl, to }: PasswordResetEmailOptions): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password - ${appName}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 16px !important;
      }
      .email-card {
        padding: 24px 20px !important;
      }
      .cta-button {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all; font-size: 1px; line-height: 1px; color: #fff;">
    Reset your password for ${appName}. This link expires in 60 minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F3EF; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin: 0 auto;">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 0 0 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <!-- Botanical Badge Logo -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background-color: #1C2E24; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle;">
                            <span style="font-size: 22px; color: #A4C2A5; line-height: 44px;">🌿</span>
                          </td>
                          <td style="padding-left: 12px;">
                            <span style="font-size: 20px; font-weight: 700; color: #1C2E24; letter-spacing: -0.5px; display: block;">
                              ${appName}
                            </span>
                            <span style="font-size: 11px; font-weight: 600; color: #52796F; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-top: 1px;">
                              Lead Intelligence Suite
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FCFBF8; border-radius: 20px; border: 1px solid #E5E2DA; padding: 36px 32px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);">
                
                <!-- Security Icon & Title -->
                <tr>
                  <td align="left" style="padding-bottom: 20px;">
                    <div style="display: inline-block; background-color: #EBF3ED; border: 1px solid #D1E5D5; border-radius: 10px; padding: 6px 12px; margin-bottom: 14px;">
                      <span style="font-size: 12px; font-weight: 600; color: #2D5A3C;">🔐 Security Request</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1C2E24; line-height: 1.3; letter-spacing: -0.3px;">
                      Reset Your Password
                    </h1>
                  </td>
                </tr>

                <!-- Greeting & Body -->
                <tr>
                  <td style="font-size: 15px; line-height: 1.65; color: #4A5568; padding-bottom: 26px;">
                    <p style="margin: 0 0 14px 0;">Hello <strong>${name || "there"}</strong>,</p>
                    <p style="margin: 0 0 14px 0;">
                      We received a request to reset the password associated with your account (<strong>${to}</strong>).
                    </p>
                    <p style="margin: 0;">
                      Click the button below to choose a new password. For security purposes, this link will expire in <strong>60 minutes</strong>.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="left" style="padding-bottom: 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #1C2E24;">
                          <a href="${resetUrl}" target="_blank" class="cta-button" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #1C2E24; letter-spacing: 0.2px;">
                            Reset Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback Link Section -->
                <tr>
                  <td style="border-top: 1px solid #EFECE6; padding-top: 22px; padding-bottom: 22px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">
                      Button not working?
                    </p>
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4A5568;">
                      Copy and paste this link into your web browser:
                    </p>
                    <div style="margin-top: 8px; padding: 12px; background-color: #F7F6F2; border-radius: 8px; border: 1px solid #E8E5DD; word-break: break-all;">
                      <a href="${resetUrl}" target="_blank" style="font-size: 12px; color: #2D5A3C; text-decoration: none; font-family: monospace;">
                        ${resetUrl}
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Security Advisory Box -->
                <tr>
                  <td style="background-color: #F9F8F5; border-radius: 12px; padding: 16px; border: 1px solid #ECE8DF;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top" style="width: 24px; padding-right: 10px;">
                          <span style="font-size: 16px;">🛡️</span>
                        </td>
                        <td style="font-size: 12px; line-height: 1.5; color: #718096;">
                          <strong style="color: #2D3748;">Didn't request this?</strong> If you didn't ask to reset your password, you can safely disregard this email. Your current password will remain unchanged and your account is secure.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td align="center" style="padding: 28px 16px 0 16px; font-size: 12px; line-height: 1.6; color: #8C8B85;">
              <p style="margin: 0 0 6px 0;">
                © ${currentYear} <strong>${appName}</strong>. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #A09E96;">
                This automated security notification was sent to ${to}. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a password reset email via configured SMTP credentials.
 */
export async function sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    const html = getPasswordResetHtml(options);

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: options.to,
      subject: `Reset your ${appName} password`,
      html,
      text: `Hello ${options.name || "User"},\n\nWe received a request to reset your password for ${appName}.\n\nPlease visit the following link to choose a new password (valid for 60 minutes):\n${options.resetUrl}\n\nIf you did not request this, you can safely ignore this message.\n\n— The ${appName} Team`,
    });

    console.log(`[SMTP] Password reset email sent to ${options.to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[SMTP ERROR] Failed to send password reset email:", error);
    throw new Error(`Email delivery failed: ${error?.message || "Unknown SMTP error"}`);
  }
}
