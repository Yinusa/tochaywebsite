import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/resend";
import { getApprovalEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName = "Client",
      deckTitle = "Presentation Deck",
      assetFilename = "Asset",
      category = "Design",
      fileUrl,
      reviewerName = "Client Reviewer",
      approvedCount,
      totalCount,
      token,
    } = body;

    const portalUrl = token
      ? `https://tofunmiyinusa.com/presentation/${token}`
      : undefined;

    const emailHtml = getApprovalEmailHtml({
      clientName,
      deckTitle,
      assetFilename,
      category,
      fileUrl,
      reviewerName,
      approvedCount,
      totalCount,
      portalUrl,
    });

    const isComplete = totalCount && approvedCount && approvedCount >= totalCount;
    const subjectPrefix = isComplete ? "🎉 Deck Complete:" : "✓ Approved:";

    const emailResult = await sendNotificationEmail({
      subject: `${subjectPrefix} ${clientName} approved "${assetFilename}" - ${deckTitle}`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailId: emailResult.id,
    });
  } catch (err: any) {
    console.error("Presentation approved API handler error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
