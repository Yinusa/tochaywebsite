import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail, DEFAULT_RECIPIENT } from "@/lib/resend";
import { getTestEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const emailHtml = getTestEmailHtml({ timestamp });

    const result = await sendNotificationEmail({
      subject: `⚡ Test Email: TY Studio Resend Integration Verified`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: result.success,
      recipient: DEFAULT_RECIPIENT,
      senderUsed: result.sender,
      emailId: result.id,
      error: result.error,
      timestamp,
    });
  } catch (err: any) {
    console.error("Test email API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
