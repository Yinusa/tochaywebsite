import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/resend";
import { getApprovalEmailHtml, getRevisionRequestedEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      status = "Approved",
      clientName = "Client",
      deckTitle = "Presentation Deck",
      assetFilename = "Asset",
      category = "Design",
      fileUrl,
      reviewerName = "Client Reviewer",
      comment,
      approvedCount,
      totalCount,
      token,
    } = body;

    const portalUrl = token
      ? `https://tofunmiyinusa.com/presentation/${token}`
      : undefined;

    let emailHtml = "";
    let subject = "";

    if (status === "Rejected") {
      // 1. Changes Requested Notification
      emailHtml = getRevisionRequestedEmailHtml({
        clientName,
        deckTitle,
        assetFilename,
        category,
        fileUrl,
        reviewerName,
        comment,
        portalUrl,
      });

      subject = `⚠️ Changes Requested: ${clientName} requested revisions on "${assetFilename}" - ${deckTitle}`;
    } else {
      // 2. Approval Notification
      emailHtml = getApprovalEmailHtml({
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
      subject = `${subjectPrefix} ${clientName} approved "${assetFilename}" - ${deckTitle}`;
    }

    const emailResult = await sendNotificationEmail({
      subject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailId: emailResult.id,
    });
  } catch (err: any) {
    console.error("Presentation status API handler error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
