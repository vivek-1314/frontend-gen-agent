# frontend-gen-agent

An agentic LangGraph pipeline that generates production-ready React/Next.js frontend code from a plain English prompt.
You describe a UI. The agent plans it, generates each component in parallel, and assembles a complete, runnable codebase — with Framer Motion animations and Tailwind styling baked in.

---

## How It Works

The pipeline runs as a directed graph of LLM nodes orchestrated by LangGraph. Each node has a focused responsibility; no node tries to do everything.

WorkFlow of graph [here](https://app.eraser.io/workspace/SanJdIPhCcQ0bBc0LJjf?origin=share)

---

## Tech Stack

**Backend (Python)**
- [LangGraph](https://github.com/langchain-ai/langgraph) — graph orchestration, fan-out/fan-in state management
- [LangChain](https://github.com/langchain-ai/langchain) 
- [LangSmith](https://smith.langchain.com/) — debugging and tracking
- [Groq](https://groq.com/) — LLM inference (openai/gpt-oss-120b )
- [FastAPI](https://fastapi.tiangolo.com/) — HTTP server exposing the pipeline as an API
- [Pydantic](https://docs.pydantic.dev/) — structured output schemas for each node

**Frontend (TypeScript)** 
> The UI was scaffolded using Lovable — primary focus of this project was the backend pipeline.
- [Next.js 14](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/) — styling

---

## Project Structure

```
frontend-gen-agent/
├── backend-pipeline/          # Python LangGraph pipeline + FastAPI server
│   ├── src/
│   │   ├── app/
│   │   │   ├── graph.py       # LangGraph graph definition (nodes + edges)
│   │   │   ├── nodes/
│   │   │   │   ├── blueprint.py
│   │   │   │   ├── intent.py
│   │   │   │   ├── page_generator.py
|   |   |   |   ├── section_generator.py
│   │   │   │   └── section_planner.py
│   │   │   ├── state.py       # Shared graph state (TypedDict)
|   |   |   └──prompt.py     # prompt for nodes
│   │   ├── llm.py           # llm instance
│   │   └── main.py          # FastAPI entry point
│   └── requirements.txt
│
└── ui/                        # Next.js frontend — prompt input + code viewer
    ├── src/
    ├── components/
    ├── public/
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repo

```bash
git clone https://github.com/vivek-1314/frontend-gen-agent.git
cd frontend-gen-agent
```

### 2. Set up the backend

```bash
cd backend-pipeline
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the server:

```bash
uvicorn src.server:app --reload
```

The API will be live at `http://localhost:8000`.

### 3. Set up the UI

```bash
cd ../ui
npm install
npm run dev
```

The UI will be live at `http://localhost:3000`.

---

## Usage

1. Open `http://localhost:3000`
2. Type a prompt describing the UI you want — e.g. *"A SaaS landing page with a hero section, feature cards, and a pricing table"*
3. Hit **Generate**
4. The pipeline runs, and the generated file tree appears in the code viewer on the right
5. download whole project codebase .

---

## Author

**Vivek** — [github.com/vivek-1314](https://github.com/vivek-1314)
