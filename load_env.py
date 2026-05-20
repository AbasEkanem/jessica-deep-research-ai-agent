# import the local models 
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from dotenv import load_dotenv
from langchain_community.utilities import GoogleSerperAPIWrapper, SerpAPIWrapper
from langchain_tavily import TavilySearch
from langchain_exa import ExaSearchResults
from langchain_linkup import LinkupSearchTool
import os
load_dotenv()

# Caching removed temporarily due to version incompatibility with langchain

# load the api keys
nvidia_api = os.getenv("NVIDIA_API_KEY")
nvidia_api_2 = os.getenv("NVIDIA_API_KEY2")
tavily_api = os.getenv("TAVILY_API_KEY")
serpapi = os.getenv("SERPAPI_API_KEY")
serper_dev_api = os.getenv("SERPER_DEV_API_KEY")
exa_api = os.getenv("EXA_API_KEY")
linkup_api = os.getenv("LINKUP_API_KEY")

# load and initialize the chat_model
chat_model = ChatNVIDIA(
  model="nvidia/nemotron-3-nano-30b-a3b",
  api_key=nvidia_api, 
  temperature=0.7,
  top_p=0.95,
  max_tokens=16384,
)


chat_model_2 = ChatNVIDIA(
  model="nvidia/nemotron-3-nano-30b-a3b",
  api_key=nvidia_api_2, 
  temperature=0.6,
  top_p=0.95,
  max_tokens=65536,
)



# load the tools
tavily_search = TavilySearch(
    api_key=tavily_api,
    max_results=10
)
serper_dev_search = GoogleSerperAPIWrapper(
    serper_api_key=serper_dev_api,
    k=10
)
exa_search = ExaSearchResults(
    api_key=exa_api,
    max_results=10
)
serpapi_search = SerpAPIWrapper(
    serpapi_api_key=serpapi,
)
linkup_search = LinkupSearchTool(
    api_key=linkup_api,
    depth="standard",
    output_type="searchResults"
)