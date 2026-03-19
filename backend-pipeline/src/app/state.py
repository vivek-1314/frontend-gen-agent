import os
from typing import TypedDict
from fastapi import FastAPI, WebSocket

class State(TypedDict) :
    user_prompt: str
    api_key: str     
    intent: dict 
    blueprint: dict
    section_plan: dict
    section_idx: int
    page_index: int
    status: str
    page_status: str
