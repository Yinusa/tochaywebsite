/**
 * Sleek, Modern & Minimal Light HTML Email Templates for TY Studio
 * Design Language: Clean high-end editorial light theme, sharp typography, natural logo aspect ratio, and crisp card structure.
 */

// Brand Black Logo URL (natural aspect ratio: 1265 x 988 -> ~41 x 32)
const LOGO_BLACK_URL = "https://tofunmiyinusa.com/images/toflogoblack.png";

/**
 * Base Email Layout Wrapper (Clean Light Minimalist)
 */
function wrapEmailLayout({
  previewText,
  badgeText,
  badgeBg = "#f4f4f5",
  badgeTextColor = "#18181b",
  title,
  subtitle,
  children,
  actionButton,
}: {
  previewText: string;
  badgeText: string;
  badgeBg?: string;
  badgeTextColor?: string;
  title: string;
  subtitle?: string;
  children: string;
  actionButton?: { text: string; url: string };
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased;">
  <!-- Preview Text Hidden -->
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Header Brand Row -->
          <tr>
            <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f0f0f2; background-color: #ffffff;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <!-- Logo Mark Only (Natural Ratio) -->
                    <img src="${LOGO_BLACK_URL}" alt="Logo" width="41" height="32" style="display: block; width: 41px; height: 32px; object-fit: contain; vertical-align: middle; border: 0;" />
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeTextColor}; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; border: 1px solid rgba(0, 0, 0, 0.06);">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading Area -->
          <tr>
            <td style="padding: 32px 36px 12px 36px;">
              <h1 style="margin: 0; font-size: 23px; font-weight: 700; color: #09090b; letter-spacing: -0.02em; line-height: 1.3;">
                ${title}
              </h1>
              ${
                subtitle
                  ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">${subtitle}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Dynamic Content Body -->
          <tr>
            <td style="padding: 12px 36px 32px 36px;">
              ${children}

              ${
                actionButton
                  ? `
              <div style="margin-top: 28px; text-align: left;">
                <a href="${actionButton.url}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 13px 26px; border-radius: 9999px; letter-spacing: -0.01em; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);">
                  ${actionButton.text} &rarr;
                </a>
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Minimal Editorial Footer -->
          <tr>
            <td style="padding: 22px 36px; background-color: #fafafa; border-top: 1px solid #f0f0f2; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
                TY STUDIO &bull; Creative Technology & Brand Systems<br>
                <a href="https://tofunmiyinusa.com" target="_blank" style="color: #18181b; text-decoration: none; font-weight: 600;">tofunmiyinusa.com</a>
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
 * 1. Contact Form Inquiry Email Template (Clean Light)
 */
export function getContactEmailHtml({
  name,
  email,
  message,
  submittedAt = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
}: {
  name: string;
  email: string;
  message: string;
  submittedAt?: string;
}) {
  const content = `
    <!-- Sender Metadata Grid -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0 20px 0; background-color: #f8f8fa; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Sender Name
          </span>
          <span style="font-size: 15px; font-weight: 600; color: #09090b;">
            ${name}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Email Address
          </span>
          <a href="mailto:${email}" style="font-size: 15px; font-weight: 600; color: #09090b; text-decoration: underline;">
            ${email}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Submitted At
          </span>
          <span style="font-size: 13px; font-weight: 500; color: #52525b;">
            ${submittedAt}
          </span>
        </td>
      </tr>
    </table>

    <!-- Message Body Quote -->
    <div style="margin-top: 18px;">
      <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
        Inquiry Message
      </span>
      <div style="background-color: #fafafc; border-left: 3px solid #09090b; border-top: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #18181b; white-space: pre-wrap;">
${message}
      </div>
    </div>
  `;

  return wrapEmailLayout({
    previewText: `New portfolio inquiry from ${name} (${email})`,
    badgeText: "New Inquiry",
    badgeBg: "#fef08a",
    badgeTextColor: "#713f12",
    title: "New Contact Submission",
    subtitle: `You received a new message from your portfolio contact section.`,
    children: content,
    actionButton: {
      text: `Reply to ${name}`,
      url: `mailto:${email}?subject=${encodeURIComponent(`Re: Inquiry from ${name} - TY Studio`)}`,
    },
  });
}

/**
 * 2. Client Presentation Approval Notification Template (Clean Light)
 */
export function getApprovalEmailHtml({
  clientName,
  deckTitle,
  assetFilename,
  category,
  fileUrl,
  reviewerName = "Client Reviewer",
  approvedCount,
  totalCount,
  portalUrl,
}: {
  clientName: string;
  deckTitle: string;
  assetFilename: string;
  category: string;
  fileUrl?: string;
  reviewerName?: string;
  approvedCount?: number;
  totalCount?: number;
  portalUrl?: string;
}) {
  const isComplete = totalCount && approvedCount && approvedCount >= totalCount;

  const content = `
    <!-- Approval Milestone Grid -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0 20px 0; background-color: #f8f8fa; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Client & Project
          </span>
          <span style="font-size: 15px; font-weight: 700; color: #09090b;">
            ${clientName} &bull; ${deckTitle}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Approved Deliverable
          </span>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px;">
            <span style="font-size: 15px; font-weight: 600; color: #16a34a;">
              &check; ${assetFilename}
            </span>
            <span style="display: inline-block; background-color: #e4e4e7; color: #52525b; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 6px; margin-left: 8px;">
              ${category}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Approved By
          </span>
          <span style="font-size: 14px; font-weight: 600; color: #27272a;">
            ${reviewerName}
          </span>
        </td>
      </tr>
      ${
        approvedCount && totalCount
          ? `
      <tr>
        <td style="padding: 14px 18px;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
            Deck Progress (${approvedCount}/${totalCount} Approved)
          </span>
          <div style="width: 100%; height: 6px; background-color: #e4e4e7; border-radius: 9999px; overflow: hidden;">
            <div style="width: ${Math.round((approvedCount / totalCount) * 100)}%; height: 100%; background-color: #16a34a; border-radius: 9999px;"></div>
          </div>
        </td>
      </tr>
      `
          : ""
      }
    </table>

    ${
      fileUrl && (fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg") || fileUrl.endsWith(".png") || fileUrl.endsWith(".webp"))
        ? `
    <!-- Asset Preview Card -->
    <div style="margin: 18px 0; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; background-color: #fafafa; text-align: center; padding: 12px;">
      <img src="${fileUrl}" alt="${assetFilename}" style="max-width: 100%; max-height: 280px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;" />
    </div>
    `
        : ""
    }
  `;

  return wrapEmailLayout({
    previewText: `✓ ${clientName} approved "${assetFilename}" in ${deckTitle}`,
    badgeText: isComplete ? "Deck Complete" : "Asset Approved",
    badgeBg: isComplete ? "#bbf7d0" : "#dcfce7",
    badgeTextColor: "#166534",
    title: isComplete ? "Presentation 100% Approved!" : "Deliverable Approved",
    subtitle: `${clientName} signed off on deliverable <strong style="color: #09090b;">${assetFilename}</strong>.`,
    children: content,
    actionButton: portalUrl
      ? {
          text: "Open Client Presentation",
          url: portalUrl,
        }
      : undefined,
  });
}

/**
 * 3. Test Verification Email Template (Clean Light)
 */
export function getTestEmailHtml({
  timestamp = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
}: {
  timestamp?: string;
} = {}) {
  const content = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0 20px 0; background-color: #f8f8fa; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Integration Status
          </span>
          <span style="font-size: 15px; font-weight: 700; color: #16a34a;">
            &check; Connected & Verified
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #eeeeef;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Provider & Domain
          </span>
          <span style="font-size: 14px; font-weight: 600; color: #09090b;">
            Resend SDK &bull; tofunmiyinusa.com
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <span style="font-size: 11px; font-weight: 700; color: #8c8c94; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px;">
            Dispatched At
          </span>
          <span style="font-size: 13px; font-weight: 500; color: #52525b;">
            ${timestamp}
          </span>
        </td>
      </tr>
    </table>

    <div style="background-color: #fafafc; border: 1px solid #e4e4e7; border-radius: 12px; padding: 18px; font-size: 14px; line-height: 1.6; color: #3f3f46;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #09090b;">Active Notification Channels:</p>
      <ul style="margin: 0; padding-left: 20px; color: #52525b;">
        <li style="margin-bottom: 4px;"><strong style="color: #09090b;">Contact Inquiries:</strong> Sends instant alerts whenever someone submits a message on your portfolio contact form with direct email reply link.</li>
        <li><strong style="color: #09090b;">Client Approvals:</strong> Sends instant sign-off alerts whenever a client approves deliverables in their presentation showcase deck.</li>
      </ul>
    </div>
  `;

  return wrapEmailLayout({
    previewText: "Test verification email from TY Studio portfolio",
    badgeText: "System Test",
    badgeBg: "#e0f2fe",
    badgeTextColor: "#0369a1",
    title: "Email Integration Verified",
    subtitle: "Your portfolio notification engine is fully configured and styled with your clean light aesthetic.",
    children: content,
    actionButton: {
      text: "Visit Portfolio",
      url: "https://tofunmiyinusa.com",
    },
  });
}
