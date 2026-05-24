"""
Jessica 3.0 — Email API
Supports:
  - Sending via Resend (primary, production-grade)
  - Sending via Gmail SMTP (fallback)
  - Reading inbox via IMAP (Gmail)
  - Logging all activity to Supabase
"""

from __future__ import annotations

import os
import json
import imaplib
import email
import email.header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.utils import make_msgid, formatdate
from email import encoders
from datetime import datetime, timezone, timedelta
import smtplib

import resend
from supabase import create_client, Client
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

#Credentials 
RESEND_API_KEY     = os.getenv("RESEND_API_KEY", "")

GMAIL_ADDRESS      = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

_default_from = f"Jessica 3.0 <{GMAIL_ADDRESS}>" if GMAIL_ADDRESS else "Jessica 3.0 <[EMAIL_ADDRESS]>"
RESEND_FROM        = os.getenv("RESEND_FROM_EMAIL", _default_from)

SUPABASE_URL       = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY       = os.getenv("SUPABASE_KEY", "")

# Supabase client (optional — gracefully degrades if not set)
_supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        _supabase = None


# Supabase helpers
def _log_email_to_supabase(
    direction: str,        
    from_addr: str,
    to_addr: str,
    subject: str,
    body: str,
    status: str = "ok",
    error: str = "",
):
    """Persist email event to Supabase `jessica_emails` table."""
    if not _supabase:
        return
    try:
        _supabase.table("jessica_emails").insert({
            "direction":  direction,
            "from_email": from_addr,
            "to_email":   to_addr,
            "subject":    subject,
            "body":       body[:4000],          
            "status":     status,
            "error":      error,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass                                    


# HTML email template
def _build_html_email(subject: str, body: str) -> str:
    """Wrap body in Jessica 3.0-branded dark HTML email template."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c14;padding:36px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0"
             style="background:#0f1220;border-radius:18px;overflow:hidden;border:1px solid rgba(124,111,247,0.15);">

        <!-- Header -->
        <tr>
          <td style="padding:26px 32px 18px;border-bottom:1px solid rgba(124,111,247,0.1);">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <span style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#c4b5fd,#7c6ff7,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                  Jessica 3.0
                </span>
                <span style="font-size:12px;color:#4b5375;margin-left:10px;">Deep Research AI Agent</span>
              </td>
              <td align="right">
                <span style="display:inline-block;background:rgba(124,111,247,0.15);color:#a78bfa;
                             font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;
                             border:1px solid rgba(124,111,247,0.25);">
                  Research Report
                </span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Subject -->
        <tr>
          <td style="padding:22px 32px 10px;">
            <h1 style="margin:0;font-size:19px;font-weight:700;color:#e8e6ff;line-height:1.35;">
              {subject}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:4px 32px 32px;">
            <div style="font-size:14px;line-height:1.8;color:#8b8fb0;white-space:pre-wrap;">
              {body}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid rgba(124,111,247,0.1);background:#080c14;">
            <p style="margin:0;font-size:11px;color:#323659;text-align:center;">
              Sent by Jessica 3.0 — Deep Research AI &mdash;
              Powered by Tavily · Exa · SerperDev · SerpAPI · DuckDuckGo
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


#  TOOL: send_research_email


@tool
def send_research_email(
    to_email: str,
    subject: str,
    research_content: str,
    attachment_paths: list[str] = None,
) -> str:
    """
    Send a comprehensive research report or analysis via email with professional HTML formatting.

    Use this tool when the user requests to email, send, or share deep research findings,
    competitive analysis, market insights, or investigation results with stakeholders.

    Delivery priority:
      1. Resend API  — primary (production-grade, ~99% deliverability)
      2. Gmail SMTP  — fallback if Resend key is not configured

    All emails are logged to Supabase `jessica_emails` table for audit and retrieval.

    Args:
        to_email: Recipient's email address (e.g. 'analyst@company.com')
        subject: Descriptive subject line summarising the research topic
        research_content: Full research findings, analysis, citations, and conclusions
        attachment_paths: Optional list of absolute paths to files to attach to the email.

    Returns:
        Confirmation message with delivery method and status
    """
    if not to_email or "@" not in to_email:
        return f"Email delivery failed: '{to_email}' is not a valid email address."

    html_body = _build_html_email(subject, research_content)
    method = "unknown"

    resend_attachments = []
    if attachment_paths:
        for path in attachment_paths:
            if os.path.isfile(path):
                filename = os.path.basename(path)
                with open(path, "rb") as f:
                    file_data = f.read()
                resend_attachments.append({
                    "filename": filename,
                    "content": list(file_data)
                })

    # ── 1. Try Resend ──
    if RESEND_API_KEY:
        try:
            resend.api_key = RESEND_API_KEY
            payload = {
                "from":    RESEND_FROM,
                "to":      [to_email],
                "subject": subject,
                "text":    research_content,
                "html":    html_body,
            }
            if resend_attachments:
                payload["attachments"] = resend_attachments
            resend.Emails.send(payload)
            method = "Resend"
            _log_email_to_supabase("sent", RESEND_FROM, to_email, subject, research_content)
            return (
                f"✓ Email delivered via Resend\n"
                f"Recipient : {to_email}\n"
                f"Subject   : {subject}\n"
                f"Logged    : Supabase jessica_emails ✓"
            )
        except Exception as e:
            method = "Resend (failed)"
            _log_email_to_supabase("sent", RESEND_FROM, to_email, subject, research_content, "error", str(e))
            # Fall through to Gmail

    # ── 2. Fallback: Gmail SMTP ──
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return (
            "Email delivery failed: Neither Resend API key nor Gmail credentials are configured.\n"
            "Set RESEND_API_KEY (recommended) or GMAIL_ADDRESS + GMAIL_APP_PASSWORD in .env"
        )

    try:
        msg = MIMEMultipart("mixed")
        msg["From"]    = f"Jessica 3.0 Research Agent <{GMAIL_ADDRESS}>"
        msg["To"]      = to_email
        msg["Subject"] = subject
        msg["Date"]    = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="jessica.ai")

        body_part = MIMEMultipart("alternative")
        body_part.attach(MIMEText(research_content, "plain", "utf-8"))
        body_part.attach(MIMEText(html_body, "html", "utf-8"))
        msg.attach(body_part)

        if attachment_paths:
            for path in attachment_paths:
                if os.path.isfile(path):
                    filename = os.path.basename(path)
                    with open(path, "rb") as f:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
                    msg.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())

        method = "Gmail SMTP"
        _log_email_to_supabase("sent", GMAIL_ADDRESS, to_email, subject, research_content)
        return (
            f"✓ Email delivered via Gmail SMTP\n"
            f"Recipient : {to_email}\n"
            f"Subject   : {subject}\n"
            f"Logged    : Supabase jessica_emails ✓"
        )

    except smtplib.SMTPAuthenticationError:
        return "Email delivery failed: Gmail authentication error. Use a Gmail App Password, not your account password."
    except Exception as e:
        _log_email_to_supabase("sent", GMAIL_ADDRESS, to_email, subject, research_content, "error", str(e))
        return f"Email delivery failed: {str(e)}"



# TOOL: read_inbox


@tool
def read_inbox(
    max_emails: int = 10,
    folder: str = "INBOX",
) -> str:
    """
    Read the most recent emails from Jessica's Gmail inbox via IMAP.

    Use this tool when the user asks to check email, read messages, find replies,
    or retrieve incoming research requests sent to Jessica's address.

    All retrieved emails are logged to Supabase `jessica_emails` for audit.

    Args:
        max_emails: Maximum number of emails to retrieve (default 10, max 50)
        folder: IMAP mailbox folder to read from (default 'INBOX')

    Returns:
        Formatted list of recent emails with sender, subject, date, and preview
    """
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return "Inbox read failed: Gmail credentials not configured in .env"

    max_emails = min(max_emails, 50)

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        mail.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        mail.select(folder)

        _, message_ids = mail.search(None, "ALL")
        ids = message_ids[0].split()
        recent_ids = ids[-max_emails:][::-1]   # newest first

        results = []
        for msg_id in recent_ids:
            _, msg_data = mail.fetch(msg_id, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            subject   = _decode_header(msg.get("Subject", "(no subject)"))
            from_addr = _decode_header(msg.get("From", ""))
            date_str  = msg.get("Date", "")
            body      = _extract_body(msg)[:600]

            results.append({
                "id":      msg_id.decode(),
                "from":    from_addr,
                "subject": subject,
                "date":    date_str,
                "preview": body.strip(),
            })
            _log_email_to_supabase("received", from_addr, GMAIL_ADDRESS, subject, body)

        mail.logout()

        if not results:
            return f"No emails found in {folder}."

        lines = [f"📬 {len(results)} emails retrieved from {folder}:\n"]
        for i, e in enumerate(results, 1):
            lines.append(
                f"{'─'*55}\n"
                f"[{i}] From    : {e['from']}\n"
                f"    Subject : {e['subject']}\n"
                f"    Date    : {e['date']}\n"
                f"    Preview : {e['preview'][:300]}…\n"
            )
        return "\n".join(lines)

    except Exception as err:
        return f"Inbox read failed: {err}"


# TOOL: search_emails


@tool
def search_emails(
    query: str,
    folder: str = "INBOX",
    max_results: int = 10,
) -> str:
    """
    Search Jessica's Gmail inbox for emails matching a keyword, sender, or subject.

    Use this tool when the user asks to find a specific email, look for replies
    from a certain person, or retrieve emails about a particular research topic.

    Results are also cross-referenced with the Supabase jessica_emails log.

    Args:
        query: Search term — searches subject and body (e.g. 'quantum computing', 'from:alice@example.com')
        folder: IMAP mailbox folder (default 'INBOX')
        max_results: Maximum emails to return (default 10)

    Returns:
        Matching emails with sender, subject, date, and content preview
    """
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return "Email search failed: Gmail credentials not configured."

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        mail.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        mail.select(folder)

        # Build IMAP search criterion
        if query.startswith("from:"):
            criterion = f'FROM "{query[5:].strip()}"'
        elif query.startswith("subject:"):
            criterion = f'SUBJECT "{query[8:].strip()}"'
        else:
            criterion = f'TEXT "{query}"'

        _, message_ids = mail.search(None, criterion)
        ids = message_ids[0].split()
        recent = ids[-max_results:][::-1]

        if not recent:
            return f"No emails found matching '{query}' in {folder}."

        results = []
        for msg_id in recent:
            _, msg_data = mail.fetch(msg_id, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)
            subject   = _decode_header(msg.get("Subject", "(no subject)"))
            from_addr = _decode_header(msg.get("From", ""))
            date_str  = msg.get("Date", "")
            body      = _extract_body(msg)[:800]
            results.append({"from": from_addr, "subject": subject, "date": date_str, "body": body})

        mail.logout()

        lines = [f"🔍 {len(results)} email(s) matching '{query}':\n"]
        for i, e in enumerate(results, 1):
            lines.append(
                f"{'─'*55}\n"
                f"[{i}] From    : {e['from']}\n"
                f"    Subject : {e['subject']}\n"
                f"    Date    : {e['date']}\n"
                f"    Content : {e['body'][:400]}…\n"
            )
        return "\n".join(lines)

    except Exception as err:
        return f"Email search failed: {err}"


# TOOL: get_sent_email_log

@tool
def get_sent_email_log(
    limit: int = 20,
) -> str:
    """
    Retrieve Jessica's sent and received email history from Supabase.

    Use this tool when the user asks 'what emails did you send?', 'show my email history',
    or wants to review past communications that Jessica has handled.

    Args:
        limit: Number of records to retrieve (default 20, max 100)

    Returns:
        Chronological log of all emails sent or received by Jessica
    """
    if not _supabase:
        return "Supabase not configured — email log unavailable. Set SUPABASE_URL and SUPABASE_KEY in .env"

    try:
        limit = min(limit, 100)
        resp = (
            _supabase.table("jessica_emails")
            .select("direction,from_email,to_email,subject,status,created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return "No email history found in Supabase."

        lines = [f"📋 Email log — {len(rows)} record(s):\n"]
        for r in rows:
            arrow = "→" if r["direction"] == "sent" else "←"
            lines.append(
                f"{'─'*50}\n"
                f"[{r['direction'].upper()}] {arrow}  {r.get('created_at','')[:16]}\n"
                f"  From   : {r.get('from_email','')}\n"
                f"  To     : {r.get('to_email','')}\n"
                f"  Subject: {r.get('subject','')}\n"
                f"  Status : {r.get('status','')}\n"
            )
        return "\n".join(lines)

    except Exception as e:
        return f"Failed to retrieve email log: {e}"


# TOOL: schedule_research_email
# Imported from schedule_email_tool.py — that module has the correct timezone-aware
# parsing logic. Do NOT redefine this tool here.
from schedule_email_tool import schedule_research_email



# Private helpers

def _decode_header(raw: str) -> str:
    parts = email.header.decode_header(raw)
    decoded = []
    for part, enc in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            decoded.append(str(part))
    return " ".join(decoded)


def _extract_body(msg: email.message.Message) -> str:
    """Extract plain text body from a MIME message."""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            cd = str(part.get("Content-Disposition", ""))
            if ct == "text/plain" and "attachment" not in cd:
                try:
                    return part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="replace"
                    )
                except Exception:
                    return ""
    else:
        try:
            return msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8", errors="replace"
            )
        except Exception:
            return ""
    return ""


# Tool registry
email_tools = [
    send_research_email,
    read_inbox,
    search_emails,
    get_sent_email_log,
    schedule_research_email,  # imported from schedule_email_tool.py
]