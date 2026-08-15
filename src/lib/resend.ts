import { Resend } from "resend";

// Default settings
export const DEFAULT_RECIPIENT = process.env.NOTIFICATION_RECIPIENT_EMAIL || "tofunmiyinusa01@gmail.com";
export const PRIMARY_SENDER = process.env.RESEND_FROM_EMAIL || "TY Studio <notifications@tofunmiyinusa.com>";
export const FALLBACK_SENDER = "TY Studio <onboarding@resend.dev>";

/**
 * Lazily initialize Resend client instance to avoid build-time errors when env vars are missing
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new Resend(apiKey);
}

interface SendEmailOptions {
  to?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email using Resend with automatic verified-domain fallback
 */
export async function sendNotificationEmail({
  to = DEFAULT_RECIPIENT,
  subject,
  html,
  replyTo,
}: SendEmailOptions) {
  const recipient = Array.isArray(to) ? to : [to];
  const resend = getResendClient();

  if (!resend) {
    console.warn("RESEND_API_KEY is not configured in environment variables.");
    return {
      success: false,
      error: "RESEND_API_KEY is missing. Please add RESEND_API_KEY to your Vercel Project Settings.",
    };
  }

  try {
    // 1. Try sending with custom domain sender
    const response = await resend.emails.send({
      from: PRIMARY_SENDER,
      to: recipient,
      subject,
      html,
      replyTo: replyTo ? [replyTo] : undefined,
    });

    if (response.error) {
      console.warn("Primary sender notice, attempting fallback sender:", response.error.message);

      // 2. Retry with onboarding@resend.dev fallback if custom domain is unverified
      const fallbackResponse = await resend.emails.send({
        from: FALLBACK_SENDER,
        to: recipient,
        subject,
        html,
        replyTo: replyTo ? [replyTo] : undefined,
      });

      if (fallbackResponse.error) {
        throw new Error(fallbackResponse.error.message);
      }

      return { success: true, id: fallbackResponse.data?.id, sender: FALLBACK_SENDER };
    }

    return { success: true, id: response.data?.id, sender: PRIMARY_SENDER };
  } catch (err: any) {
    console.error("Resend dispatch error:", err);

    // Final fallback attempt if the first try threw an exception
    try {
      const fallbackResponse = await resend.emails.send({
        from: FALLBACK_SENDER,
        to: recipient,
        subject,
        html,
        replyTo: replyTo ? [replyTo] : undefined,
      });

      if (fallbackResponse.data?.id) {
        return { success: true, id: fallbackResponse.data?.id, sender: FALLBACK_SENDER };
      }
    } catch (fallbackErr) {
      console.error("Critical: Resend fallback also failed:", fallbackErr);
    }

    return { success: false, error: err?.message || "Failed to dispatch email" };
  }
}
