import os
import time
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from supabase import create_client
import resend

# Load environment variables
load_dotenv()

# Import helpers from the email API
from email_api import (
    _build_html_email,
    _log_email_to_supabase,
    RESEND_API_KEY,
    RESEND_FROM,
    GMAIL_ADDRESS,
    GMAIL_APP_PASSWORD,
)

def start_worker():
    print("[*] Starting Jessica's Scheduled Email Worker...")
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("[!] Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return
        
    supabase = create_client(supabase_url, supabase_key)
    print("[+] Connected to Supabase queue. Listening for pending emails...")

    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            # Fetch pending emails that are due to be sent
            resp = supabase.table("jessica_scheduled_emails") \
                .select("*") \
                .eq("status", "pending") \
                .lte("scheduled_at", now) \
                .execute()
                
            pending_jobs = resp.data
            
            if pending_jobs:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(pending_jobs)} scheduled email(s) ready to send.")
            
            for job in pending_jobs:
                job_id = job['id']
                to_email = job['to_email']
                subject = job['subject']
                body = job['body']
                
                print(f"  -> Sending to {to_email} (Subject: '{subject}')")
                
                try:
                    html_body = _build_html_email(subject, body)
                    
                    resend_success = False
                    if RESEND_API_KEY:
                        try:
                            resend.api_key = RESEND_API_KEY
                            resend.Emails.send({
                                "from": RESEND_FROM,
                                "to": [to_email],
                                "subject": subject,
                                "text": body,
                                "html": html_body,
                            })
                            _log_email_to_supabase("sent", RESEND_FROM, to_email, subject, body)
                            resend_success = True
                        except Exception as e:
                            print(f"  [WARN] Resend failed, falling back to Gmail: {e}")
                            _log_email_to_supabase("sent", RESEND_FROM, to_email, subject, body, "error", str(e))
                            
                    if not resend_success:
                        if GMAIL_ADDRESS and GMAIL_APP_PASSWORD:
                            msg = MIMEMultipart("alternative")
                            msg["From"] = f"Jessica 3.0 Research Agent <{GMAIL_ADDRESS}>"
                            msg["To"] = to_email
                            msg["Subject"] = subject
                            msg.attach(MIMEText(body, "plain", "utf-8"))
                            msg.attach(MIMEText(html_body, "html", "utf-8"))

                            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                                server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
                                server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())
                            _log_email_to_supabase("sent", GMAIL_ADDRESS, to_email, subject, body)
                        else:
                            raise Exception("Both Resend and Gmail failed or are unconfigured.")
                    
                    # Mark as sent
                    supabase.table("jessica_scheduled_emails") \
                        .update({"status": "sent", "sent_at": now}) \
                        .eq("id", job_id) \
                        .execute()
                        
                    print(f"  [OK] Successfully sent and marked as 'sent' in database.")
                    
                except Exception as e:
                    print(f"  [FAIL] Error sending email: {e}")
                    # Mark as failed
                    supabase.table("jessica_scheduled_emails") \
                        .update({"status": "failed", "error": str(e)}) \
                        .eq("id", job_id) \
                        .execute()
            
            # Poll every 30 seconds
            time.sleep(30)
            
        except Exception as e:
            print(f"[x] Worker encountered an error querying the database: {e}")
            time.sleep(30) # Wait before retrying to avoid spamming the DB

if __name__ == "__main__":
    start_worker()
