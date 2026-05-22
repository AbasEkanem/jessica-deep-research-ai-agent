"""
Datetime Tools — gives MiSol reliable access to the current date and time.
"""

from datetime import datetime, timezone, timedelta
from langchain_core.tools import tool


@tool
def get_current_datetime() -> dict:
    """
    Returns the current date and time in multiple formats.
    Use this tool whenever the user asks what today's date is, what time it is,
    or needs any current timestamp for their query.
    Always call this first instead of guessing.
    """
    # Google Cloud Run defaults to UTC. Since the user is in Nigeria,
    # we explicitly enforce UTC+1 (West Africa Time).
    nigeria_tz = timezone(timedelta(hours=1))
    now_local = datetime.now(nigeria_tz)
    now_utc   = datetime.now(timezone.utc)

    return {
        "date":          now_local.strftime("%A, %B %d, %Y"),          # e.g. "Tuesday, April 22, 2026"
        "time_local":    now_local.strftime("%I:%M %p"),               # e.g. "12:24 AM"
        "timezone":      "UTC+1 (Nigeria Time)",
        "datetime_iso":  now_local.isoformat(timespec="seconds"),      # e.g. "2026-04-22T00:24:53+01:00"
        "datetime_utc":  now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),    # e.g. "2026-04-21 23:24:53 UTC"
        "year":          now_local.year,
        "month":         now_local.strftime("%B"),
        "day":           now_local.day,
        "weekday":       now_local.strftime("%A"),
        "unix_timestamp": int(now_utc.timestamp()),
    }


# exported list 
date_time_tools = [get_current_datetime]
