import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from langchain_core.tools import tool
from email_api import _log_email_to_supabase, _build_html_email, _supabase

@tool
def schedule_research_email(
    to_email: str,
    subject: str,
    research_content: str,
    schedule_at: str,
) -> str:
    """
    Schedule a research report to be sent at a specific future date and time.
    
    Use this tool when the user says "send this email tomorrow at 9am" or "schedule a report for Friday".
    
    Args:
        to_email: Recipient's email address.
        subject: Descriptive subject line.
        research_content: The body of the research report.
        schedule_at: ISO 8601 timestamp WITH YOUR CURRENT LOCAL TIMEZONE OFFSET 
                     (e.g., '2026-04-23T09:00:00+01:00'). 
                     CRITICAL: DO NOT use 'Z' or UTC unless you explicitly did the math to convert 
                     the user's local time to UTC. Always use the offset you get from Checking Date & Time.
    
    Returns:
        Confirmation message with scheduled time and status.
    """
    if not _supabase:
        return "Scheduling failed: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env"

    # Basic validation
    if not to_email or "@" not in to_email:
        return f"Scheduling failed: '{to_email}' is not a valid email address."

    # NOTE: In a real implementation, we would use a library like 'dateparser' 
    # to handle natural language strings like "tomorrow at 9am".
    # For this draft, we expect an ISO string or we simulate the parse.
    try:
        # Simplistic parsing for demonstration
        if schedule_at.lower().startswith("tomorrow"):
            scheduled_dt = datetime.now(timezone.utc) + timedelta(days=1)
            # Adjust to specific time if provided, otherwise default to current time tomorrow
            target_time = scheduled_dt.strftime("%Y-%m-%dT09:00:00Z") # Default to 9am
        else:
            # The LLM frequently appends 'Z' or '+00:00' even when it means local time.
            # We will strip all timezone info, force it to naive, assume local time, and convert to UTC.
            clean_time = schedule_at.replace("Z", "")
            if "+" in clean_time:
                clean_time = clean_time.split("+")[0]
            
            # In case it appends e.g., -05:00 (more than 2 dashes indicates timezone suffix)
            if clean_time.count("-") > 2:
                parts = clean_time.rsplit("-", 1)
                if ":" in parts[1] or len(parts[1]) == 4:
                    clean_time = parts[0]
                    
            scheduled_dt = datetime.fromisoformat(clean_time)
            
            # Now it is guaranteed naive. Assume local system time:
            scheduled_dt = scheduled_dt.astimezone()
            
            # Convert explicitly to UTC for Supabase
            target_time = scheduled_dt.astimezone(timezone.utc).isoformat()

        # Insert into a hypothetical 'jessica_scheduled_emails' table
        _supabase.table("jessica_scheduled_emails").insert({
            "to_email": to_email,
            "subject": subject,
            "body": research_content,
            "scheduled_at": target_time,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()

        return (
            f"📅 Email scheduled successfully!\n"
            f"Recipient : {to_email}\n"
            f"Subject   : {subject}\n"
            f"Time      : {target_time}\n"
            f"Status    : Pending in Supabase queue"
        )

    except Exception as e:
        return f"Scheduling failed: {str(e)}"

# Example of a background worker logic (pseudo-code)
"""
# worker.py
import time
from email_api import send_research_email

def process_scheduled_queue():
    while True:
        now = datetime.now(timezone.utc).isoformat()
        resp = supabase.table("jessica_scheduled_emails") \
            .select("*") \
            .eq("status", "pending") \
            .lte("scheduled_at", now) \
            .execute()
        
        for job in resp.data:
            result = send_research_email(job['to_email'], job['subject'], job['body'])
            supabase.table("jessica_scheduled_emails") \
                .update({"status": "sent", "sent_at": now}) \
                .eq("id", job['id']) \
                .execute()
        
        time.sleep(60) # Poll every minute
"""
