from pydantic import BaseModel
from typing import List, Literal
import os
from src.llm import llm
from src.app.prompt import intent_node_prompt
from src.app.state import State

# output structure for intent node
class IntentOutput(BaseModel):
    site_type: str
    pages: List[str]
    style: str
    animation_level: Literal['low', 'medium', 'high']
    theme: str
    tech_stack: str

def intent_node(state: State) -> State:
    user_prompt = state["user_prompt"]

    result = llm(state["api_key"]).with_structured_output(IntentOutput).invoke(intent_node_prompt(user_prompt))

    return {
        **state,
        "intent": result.model_dump()
    }


