import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/resend";
import {
  getPortalOnboardingWelcomeEmailHtml,
  getPortalClientNotificationEmailHtml,
} from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientEmail,
      clientName = "Client",
      projectTitle = "Design Project",
      token,
      type = "onboarding", // "onboarding" | "presentation_ready" | "milestone_update" | "files_released" | "custom_message"
      headline,
      message,
      presentationToken,
    } = body;

    if (!clientEmail || !clientEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid client email address is required." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tofunmiyinusa.com";
    const portalUrl = token ? `${baseUrl}/portal/${token}` : baseUrl;
    const presentationUrl = presentationToken ? `${baseUrl}/presentation/${presentationToken}` : undefined;

    let emailHtml = "";
    let subject = "";

    if (type === "onboarding") {
      // 1. Client Onboarding Welcome Email
      emailHtml = getPortalOnboardingWelcomeEmailHtml({
        clientName,
        projectTitle,
        portalUrl,
        notificationEmail: clientEmail,
      });

      subject = `✨ Welcome to your Private Client Portal - ${projectTitle}`;
    } else {
      // 2. Milestone, Presentation, or Deliverable Update Email
      const defaultHeadline =
        type === "presentation_ready"
          ? "New Design Concepts Ready for Review"
          : type === "milestone_update"
          ? "Milestone Roadmap Progress Update"
          : type === "files_released"
          ? "Final Deliverable Asset Package Released"
          : "Studio Project Update";

      const finalHeadline = headline || defaultHeadline;

      emailHtml = getPortalClientNotificationEmailHtml({
        clientName,
        projectTitle,
        type: type as any,
        headline: finalHeadline,
        message,
        portalUrl,
        presentationUrl,
      });

      subject = `🔔 ${finalHeadline} - ${projectTitle}`;
    }

    const result = await sendNotificationEmail({
      to: clientEmail,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Notification email successfully sent to ${clientEmail}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to dispatch email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Portal notify error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
