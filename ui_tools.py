
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from langchain_core.tools import tool

# ----------------------------------------------------------------------
# Input models
# ----------------------------------------------------------------------
class MetricRowInput(BaseModel):
    metrics: List[Dict[str, Any]] = Field(
        ...,
        description=(
            "List of metrics. Each dict must have 'label' and 'value', "
            "and optional 'delta' (float) and 'positive' (bool)."
        ),
    )

    @validator("metrics", each_item=True)
    def metric_must_have_label_and_value(cls, v):
        if "label" not in v or "value" not in v:
            raise ValueError("Each metric dict must contain 'label' and 'value' keys.")
        return v


class ComparisonTableInput(BaseModel):
    columns: List[str] = Field(..., description="List of column headers.")
    rows: List[List[str]] = Field(
        ...,
        description="List of rows, where each row is a list of strings matching the columns.",
    )


class ActionButtonsInput(BaseModel):
    actions: List[Dict[str, Any]] = Field(
        ...,
        description=(
            "List of dicts with 'label', 'value', and optional 'style' "
            "('primary', 'danger', 'ghost')."
        ),
    )

    @validator("actions", each_item=True)
    def action_must_have_label_and_value(cls, v):
        if "label" not in v or "value" not in v:
            raise ValueError("Each action dict must contain 'label' and 'value' keys.")
        return v


# ----------------------------------------------------------------------
# Rendering tools
# ----------------------------------------------------------------------
@tool("render_metric_row", args_schema=MetricRowInput)
def render_metric_row(metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Renders a metric row and returns the JSON payload expected by the UI.
    Payload format:
    {
        "type": "metric_row",
        "position": "after",
        "data": {"metrics": <list of metric dicts>}
    }
    """
    return {
        "type": "metric_row",
        "position": "after",
        "data": {"metrics": metrics},
    }


@tool("render_comparison_table", args_schema=ComparisonTableInput)
def render_comparison_table(columns: List[str], rows: List[List[str]]) -> Dict[str, Any]:
    """
    Renders a comparison table and returns the JSON payload expected by the UI.
    Payload format:
    {
        "type": "comparison_table",
        "position": "replace",
        "data": {"columns": <list>, "rows": <list of rows>}
    }
    """
    return {
        "type": "comparison_table",
        "position": "replace",
        "data": {"columns": columns, "rows": rows},
    }


@tool("render_action_buttons", args_schema=ActionButtonsInput)
def render_action_buttons(actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Renders interactive buttons and returns the JSON payload expected by the UI.
    Payload format:
    {
        "type": "action_buttons",
        "data": {"actions": <list of action dicts>}
    }
    """
    return {
        "type": "action_buttons",
        "data": {"actions": actions},
    }
