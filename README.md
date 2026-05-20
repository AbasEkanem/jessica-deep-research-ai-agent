# Jessica 3.0 — Deep Research AI Intelligence Agent

Jessica 3.0 is a state-of-the-art, full-stack agentic research platform designed for comprehensive deep research, data analysis, and document intelligence. Built with **Next.js 16 (Turbopack)** and a robust **FastAPI backend**, Jessica combines multi-agent workflows, contextual memory sync, interactive generative UI components, and secure integrations.

---

## 🌟 Key Capabilities

### 1. Multi-Agent Deep Research Engine
*   **Domain Specialists:** Uses a modular sub-agent architecture (configured in `subagents.yaml`) including Code Specialists, Cross-Source Verification Engines, and Insight Synthesis Composers.
*   **Live Thought Trace:** Full visibility into the agent's reasoning process using a dynamic, collapsible **Research Trace** showing elapsed time per reasoning step.
*   **Web Search & Synthesis:** Automated multi-source searching, snippet reading, and cross-checking.

### 2. Premium & Adaptive User Interface
*   **Context-Aware Greetings:** Dynamic, daily welcome screens (Morning Sunrise, Typewriter, Friday Sparkle, Focus Grid, Zen Mode) tailored to the day of the week and user's timezone.
*   **Tailored Aesthetic:** Sleek glassmorphic card layouts, responsive sidebar, dynamic light/dark mode transitions, and balanced typography.
*   **Dynamic Layouts:** Completely responsive layout optimized for mobile screens (using `100dvh` viewport structures) and high-resolution monitors.

### 3. Interactive Generative UI Blocks
Enables rich, structured output directly within the streaming chat thread:
*   **📊 Metric Rows:** Key statistics and delta metrics.
*   **📋 Comparison Tables:** Structured side-by-side data grids.
*   **🗺️ Interactive Timelines:** Visual chronological event streams.
*   **💡 Step-by-Step Walkthroughs:** Expandable instructions and tutorials.
*   **📝 Multiple-Choice Quizzes:** Interactive comprehension checks.
*   **📁 Source Cards:** Referenced links complete with site metadata.

### 4. Active Memory Sync
*   **Silent Profile Learning:** Ingests user details (names, preferences, work styles) into a long-term memory database without interrupting workflows.
*   **Transparent Logging:** Visual indicators display when memory operations (reads, updates) occur.

### 5. Automated Email Workflows
*   **Worker Queue:** Local queue workers to draft, schedule, and send completed research reports directly to user inbox channels.

---

## 🛠️ Tech Stack

*   **Frontend:** Next.js 16 (Turbopack), React 19, Lucide Icons, KaTeX (LaTeX math rendering), CSS Variables.
*   **Backend:** FastAPI (Python 3.11+), LangChain/LangGraph, ChromaDB (Vector Store), PostgreSQL / Supabase, Uvicorn.
*   **Deployment:** Docker (Multi-stage builds), Google Cloud Run.

---

## 📂 Project Architecture

```
jessica_project/
├── backend/                  # Python agent logic and tools
├── ui/                       # Next.js 16 Frontend Workspace
│   ├── src/
│   │   ├── app/              # Styles (jessica.css, greeting-variants.css) & pages
│   │   ├── components/       # ChatArea, GreetingVariants, LoginScreen, Sidebar
│   │   ├── context/          # ThemeContext provider (Light / Dark)
│   │   └── types/            # Shared TypeScript type definitions
│   ├── next.config.ts        # Configured for static export compilation
│   └── package.json
├── requirements.txt          # Python dependencies
├── subagents.yaml            # Subagent system prompt directives
├── Dockerfile                # Production multi-stage Docker build
└── docker-compose.yaml       # Local orchestration services
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed locally:
*   Node.js 20+ and npm
*   Python 3.11+
*   Git

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

---

### 3. Local Development

#### Start the Backend API
Activate your virtual environment and install dependencies:
```bash
# Set up virtual environment
python -m venv jessica_venv
source jessica_venv/bin/activate  # On Windows: jessica_venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python fastAPI.py
```
*API will run at `http://localhost:8000` (Docs available at `/docs`)*.

#### Start the Frontend UI
Open a new terminal session:
```bash
cd ui
npm install
npm run dev
```
*Access the workspace at `http://localhost:3000`*.

---

## 🐳 Docker & Cloud Deployment

### Local Container Run
To run the full stack containerized:
```bash
docker-compose up --build
```

### Production Deployment to Google Cloud Run
The project's root `Dockerfile` automatically builds the static Next.js export, moves it into the FastAPI python container, and serves it combined on port `8080`.

1. **Authenticate and configure your Google Cloud SDK:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Build and Deploy to Cloud Run:**
   ```bash
   gcloud run deploy jessica-ai-agent --source . --port 8080 --allow-unauthenticated
   ```

---

## 🔒 Security & Verification
*   **Authentication:** Multi-step login interface ensuring workspace data segregation.
*   **Security:** Cryptographic tokens protect API sessions.
*   **Quality Gates:** Production Next.js bundles undergo strict TypeScript compilation checks.
