import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendNotificationEmail } from "@/lib/resend";
import { getContactEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, message)" },
        { status: 400 }
      );
    }

    // 1. Store in Supabase database if connected
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        await supabase.from("contact_messages").insert([{ name, email, message }]);
      }
    } catch (dbErr) {
      console.warn("Supabase contact message insert notice:", dbErr);
    }

    // 2. Format beautiful HTML email template
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const emailHtml = getContactEmailHtml({
      name,
      email,
      message,
      submittedAt,
    });

    // 3. Dispatch alert email to user
    const emailResult = await sendNotificationEmail({
      subject: `New Inquiry from ${name} - TY Studio Portfolio`,
      html: emailHtml,
      replyTo: email,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailId: emailResult.id,
    });
  } catch (err: any) {
    console.error("Contact API handler error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
