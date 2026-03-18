from fastapi import FastAPI, WebSocket
from src.app.graph import build_graph
import asyncio
import src.app.ws_context as ctx

app = FastAPI()
current_ws = None

agent = build_graph()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):

    await ws.accept()

    data = await ws.receive_json()
    prompt = data["prompt"]

    print("Prompt received:", prompt)

    await run_pipeline(prompt, ws)


async def run_pipeline(prompt, ws):
    ctx.current_ws = ws
    
    await ws.send_json({
        "type": "status",
        "message": "Starting pipeline"
    })

    await (result := agent.ainvoke(
        {
            "user_prompt": prompt,
            "ws": ws
        },
        config={"recursion_limit": 50}
    )) 

    await ws.send_json({
        "type": "status",
        "message": "Graph execution completed"
    })

    await ws.send_json({"type": "done"})