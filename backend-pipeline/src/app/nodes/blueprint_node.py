from pydantic import BaseModel
from typing import Dict, List
from src.app.prompt import blueprint_node_prompt
from src.llm import llm
from src.app.state import State

# output structure for blueprint node
class BlueprintOutput(BaseModel):
    pages: Dict[str, List[str]]  


def blueprint_node(state: State) -> State:
    
    intent = state["intent"]
    user_input = state["user_prompt"]

    result = llm(state["api_key"]).with_structured_output(BlueprintOutput).invoke(blueprint_node_prompt(intent, user_input))

    return {
        "blueprint": result,
        "page_index": 0
    }

