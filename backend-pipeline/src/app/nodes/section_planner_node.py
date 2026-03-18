from pydantic import BaseModel
from typing import List, Dict
from src.llm import llm
from src.app.prompt import section_planner_node_prompt
from langchain_core.messages import SystemMessage, HumanMessage
from src.app.state import State

class Section(BaseModel):
    section: str
    props: dict
    motion: str

class SectionPlannerOutput(BaseModel):
    Sections: List[Section]

def section_planner_node(state: State) -> State:

    result = llm.with_structured_output(SectionPlannerOutput).invoke([
        SystemMessage(content="You are a section planner AI. Return structured output only."),
        HumanMessage(content=section_planner_node_prompt(state))
    ])

    print("section Planner Node Done ✅")
    return {
        "section_plan":  result,
        "section_idx": 0,
    }

