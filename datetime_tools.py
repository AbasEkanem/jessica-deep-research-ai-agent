"""
Datetime Tools — gives MiSol reliable access to the current date and time.
"""

from datetime import datetime, timezone, timedelta
from langchain_core.tools import tool


@tool
def get_current_datetime(timezone_offset_hours: float = 1.0) -> dict:
    """
    Returns the current date and time in the specified timezone offset (default is 1.0 for Nigeria / UTC+1).
    Use this tool whenever the user asks what today's date is, what time it is,
    or needs any current timestamp for their query.
    Always call this first instead of guessing.
    
    Args:
        timezone_offset_hours: Timezone offset in hours from UTC (e.g. 1.0 for Nigeria/WAT, 0.0 for UTC/GMT, -5.0 for EST).
    """
    tz = timezone(timedelta(hours=timezone_offset_hours))
    now_local = datetime.now(tz)
    now_utc   = datetime.now(timezone.utc)

    # Convert offset to string format (e.g. "UTC+01:00" or "UTC-05:00")
    sign = "+" if timezone_offset_hours >= 0 else "-"
    abs_hours = abs(timezone_offset_hours)
    h = int(abs_hours)
    m = int((abs_hours - h) * 60)
    tz_str = f"UTC{sign}{h:02d}:{m:02d}"

    return {
        "date":          now_local.strftime("%A, %B %d, %Y"),          # e.g. "Tuesday, April 22, 2026"
        "time_local":    now_local.strftime("%I:%M %p"),               # e.g. "12:24 AM"
        "timezone":      tz_str,
        "datetime_iso":  now_local.isoformat(timespec="seconds"),      # e.g. "2026-04-22T00:24:53+01:00"
        "datetime_utc":  now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),    # e.g. "2026-04-21 23:24:53 UTC"
        "year":          now_local.year,
        "month":         now_local.strftime("%B"),
        "day":           now_local.day,
        "weekday":       now_local.strftime("%A"),
        "unix_timestamp": int(now_utc.timestamp()),
    }


@tool
def calculate_future_datetime(
    minutes: float = 0.0,
    hours: float = 0.0,
    days: float = 0.0,
) -> dict:
    """
    Calculate a future date and time by adding minutes, hours, and/or days to the current Nigeria time (UTC+1).
    Use this tool to calculate precise future times for scheduling actions (e.g. "5 minutes from now", "2 hours from now", "tomorrow").
    
    Args:
        minutes: Number of minutes to add.
        hours: Number of hours to add.
        days: Number of days to add.
    """
    nigeria_tz = timezone(timedelta(hours=1))
    now_local = datetime.now(nigeria_tz)
    future_local = now_local + timedelta(days=days, hours=hours, minutes=minutes)
    future_utc = future_local.astimezone(timezone.utc)
    
    return {
        "original_time_nigeria": now_local.strftime("%Y-%m-%d %I:%M:%S %p"),
        "future_time_nigeria":   future_local.strftime("%Y-%m-%d %I:%M:%S %p"),
        "future_iso_nigeria":    future_local.isoformat(timespec="seconds"), # e.g. "2026-05-22T14:58:00+01:00"
        "future_iso_utc":        future_utc.isoformat(timespec="seconds"),
        "added_minutes":         minutes,
        "added_hours":           hours,
        "added_days":            days,
    }


# exported list 
date_time_tools = [get_current_datetime, calculate_future_datetime]
