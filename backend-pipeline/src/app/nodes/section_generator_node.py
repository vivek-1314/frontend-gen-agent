import json
from src.llm import llm
from src.app.prompt import section_generator_prompt
from pydantic import BaseModel
from src.app.file_tools import write_file
from langchain_core.messages import SystemMessage, HumanMessage
from src.app.state import State
import src.app.ws_context as ctx


class SectionCodeOutput(BaseModel):
    code: str


async def section_builder_node(state) -> State:

    # design_system = state["design_system"]
    section_plan = state["section_plan"]
    section_idx = state["section_idx"]

    sections = section_plan.Sections

    print("curr sec_idx", section_idx, "from", len(sections))
    if section_idx >= len(sections):
        print("all good stopping")
        return {"status": "Done"}

    section = sections[section_idx]

    prompt = section_generator_prompt({
        "section": section.section,
        "motion": section.motion,
    })

    # Direct structured call — no agent, no internal loops
    messages = [
    SystemMessage(content=prompt),
    HumanMessage(content=(
        f"Section Definition:\n{section.model_dump_json(indent=2)}\n\n"
        f"Write the section. File path: Sections/{section.section}.tsx"
    )),
    ]

    # print("Prompt length:", len(str(messages)))

    response = llm.with_structured_output(SectionCodeOutput).invoke(messages)

    # Manually write the file
    write_file.invoke({
        "path": f"Sections/{section.section}.tsx",
        "content": response.code,
    })

    ws = ctx.current_ws
    if ws:
        await ws.send_json({
            "type": "file_update",
            "path": f"Sections/{section.section}.tsx",
            "content": response.code
        })

    print(f"✅ {section.section} done")

    return {
        "section_idx": section_idx + 1,
        "status": "InProgress",
    }