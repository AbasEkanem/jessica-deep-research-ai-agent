from langchain_core.tools import tool
from langchain.tools import ToolRuntime
from load_env import (
   tavily_search as _tavily_search,
   serper_dev_search as _serper_dev_search,
   exa_search as _exa_search,
   serpapi_search as _serpapi_search,
   linkup_search as _linkup_search
)
from ddgs import DDGS
from JESSICA_state import Jessica_agentState


import asyncio

@tool
async def tavily_search(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search and crawl through the web to find updated news and comprehensive
    research results about any topic. Best for deep research and recent content.
    """
    try:
        tavily_web_search = await _tavily_search.ainvoke(query)
        formatted_websearch_result = "\n\n----\n\n".join([
            f'<Document href="{doc["url"]}"/>\n{doc["content"]}\n</Document>'
            for doc in tavily_web_search
        ])
        return formatted_websearch_result if formatted_websearch_result else "No results found."
    except Exception as e:
        return f"Tavily search failed: {str(e)}"


@tool
async def serper_dev_search(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search the web via Google (SerperDev) for real-time results, breaking news,
    and recent events from the last 24-72 hours. Best for current events and
    time-sensitive information.
    """
    try:
        serper_web_search = await _serper_dev_search.arun(query)
        return str(serper_web_search)
    except Exception as e:
        return f"Serper search failed: {str(e)}"


@tool
async def exa_search_tool(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search the web via Exa for high-quality, AI-optimized search results.
    Excellent for finding authoritative sources and technical content.
    """
    try:
        exa_web_search = await _exa_search.ainvoke({"query": query})
        return str(exa_web_search)
    except Exception as e:
        return f"Exa search failed: {str(e)}"


@tool
async def ddgs_search_tool(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search the web via DuckDuckGo (DDGS) for privacy-focused, unbiased search
    results. Good for general queries and avoiding search bubble effects.
    """
    try:
        ddgs = DDGS()
        # Offload blocking call to thread to prevent event loop blocking
        ddgs_web_search = await asyncio.to_thread(ddgs.text, query, max_results=10)
        if not ddgs_web_search:
            return "No results found for this query."
        
        formatted_results = "\n\n----\n\n".join([
            f'<Document href="{result["href"]}"/>\n{result["body"]}\n</Document>'
            for result in ddgs_web_search
        ])
        return formatted_results if formatted_results else "No results found."
    except Exception as e:
        return f"DDGS search failed: {str(e)}"


@tool
async def serpapi_search_tool(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search the web via SerpAPI for comprehensive Google search results with
    rich snippets, knowledge graphs, and structured data. Best for detailed
    research requiring Google's full feature set.
    """
    try:
        serpapi_web_search = await _serpapi_search.arun(query)
        return str(serpapi_web_search)
    except Exception as e:
        return f"SerpAPI search failed: {str(e)}"

# create the link-up search tool
@tool
async def linkup_search_tool(query: str, runtime: ToolRuntime[Jessica_agentState]) -> str:
    """
    Search the web via Linkup for comprehensive search results with
    rich snippets, knowledge graphs, and structured data. Best for detailed
    research requiring Google's full feature set.
    """
    try:
        linkup_web_search = await _linkup_search.ainvoke({"query": query})
        return str(linkup_web_search)
    except Exception as e:
        return f"Linkup search failed: {str(e)}"

# create the reflection tool
@tool(parse_docstring=True)
async def deep_reflection_tool(reflection: str)->str:
    """Tool for strategic reflection on research progress and decision-making.

    Use this tool after each search to analyze the results and plan next steps systematically.
    This creates a delibrate pause in the research workflow for quality decision-making.

    When to use this tool:
    - After receiving search results, ask yourself: What key information did i find?
    - Before deciding the next steps, ask yourself: Do i have enough answer completely?
    - When accessing the deep research gaps, ask yourself: What specific information am I still missing?
    - Before concluding the deep research, ask yourself: Can I confidently provide the complete answer now?
    - How complex is the question, ask yourself: Have i reached the depth required and number of search limits?

    Reflection should address:
    1. Deep Analysis of current findings - What concrete evidence, data, or insights have I gathered so far?
    2. Identification of Research Gaps - What critical information is still missing to fully answer the query?
    3. Assessment of Search Efficiency - Have the most effective search tools and strategies been utilized?
    4. Strategic Decision-Making - Based on the findings, what are the most logical next steps to advance the research?
    5. Confidence Level - How close is the research to completion, and what remains to be done?
    6. Search Limits Check - Have the maximum number of searches been reached, or is further exploration warranted?
    7. Quality Evaluation - Are the current sources reliable, and is the information comprehensive and accurate?
    8. Completeness Check - Can the query be answered with the current findings, or is additional research necessary?
    9. Complexity Assessment - Does the query require deeper analysis or a different research approach?
    10. Next Steps Planning - What specific actions should be taken next to ensure a thorough and complete response?

    Args:
        reflection (str): Your detailed reflection on the research progress, findings, gaps, and next steps.

    Returns:
        str: Confirmation that the reflection has been recorded for decision-making.
    """
    return f"Reflection recorded: {reflection}"


# Register the websearch tools list for Jessica 3.0
websearch_tools = [
    tavily_search,
    serper_dev_search,
    exa_search_tool,
    ddgs_search_tool,
    serpapi_search_tool,
    linkup_search_tool,
    deep_reflection_tool
]