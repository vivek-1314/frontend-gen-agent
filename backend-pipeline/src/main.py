from fastapi import FastAPI, WebSocket
from src.app.graph import build_graph
import asyncio
import src.app.ws_context as ctx

app = FastAPI()
current_ws = None

@app.get("/health")
async def health():
    return {"status": "ok"}

agent = build_graph()
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    data = await ws.receive_json()
    prompt = data["prompt"]
    api_key = data["api_key"]  # ← read it here

    print("Prompt received:", prompt)

    await run_pipeline(prompt, api_key, ws)  # ← pass it down


async def run_pipeline(prompt, api_key, ws):
    ctx.current_ws = ws
    
    await ws.send_json({"type": "status", "message": "Starting pipeline"})

    await (result := agent.ainvoke(
        {
            "user_prompt": prompt,
            "api_key": api_key,   # ← pass into graph state
            "ws": ws
        },
        config={"recursion_limit": 50}
    ))

    await ws.send_json({"type": "status", "message": "Graph execution completed"})
    await ws.send_json({"type": "done"})