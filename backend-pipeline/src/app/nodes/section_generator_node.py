import json
from src.llm import llm
from src.app.prompt import section_generator_prompt
from pydantic import BaseModel
from src.app.file_tools import write_file
from langchain_core.messages import SystemMessage, HumanMessage
from src.app.state import State
import src.app.ws_context as ctx
import re


class SectionCodeOutput(BaseModel):
    code: str


async def section_builder_node(state) -> State:

    section_plan = state["section_plan"]
    section_idx = state["section_idx"]

    sections = section_plan.Sections

    if section_idx >= len(sections):
        print("All sections generated ✅")
        return {"status": "Done"}

    section = sections[section_idx]

    prompt = section_generator_prompt({
        "section": section.section,
        "motion": section.motion,
    })

    messages = [
    SystemMessage(content=prompt),
    HumanMessage(content=(
        f"Section Definition:\n{section.model_dump_json(indent=2)}\n\n"
        f"Write the section. File path: Sections/{section.section}.tsx"
    )),
    ]

    raw = llm(state["api_key"]).invoke(messages).content
    raw = re.sub(r"```json|```tsx|```typescript|```", "", raw).strip()

    # Try JSON parse first
    try:
        parsed = json.loads(raw)
        code = parsed["code"]
    except json.JSONDecodeError:
        # Model returned plain code instead of JSON wrapper
        code = raw

    # Manually write the file in testing mode, comment out for production
    # write_file.invoke({
    #     "path": f"Sections/{section.section}.tsx",
    #     "content": code,
    # })

    ws = ctx.current_ws
    if ws:
        await ws.send_json({
            "type": "file_update",
            "path": f"Sections/{section.section}.tsx",
            "content": code
        })

    return {
        "section_idx": section_idx + 1,
        "status": "InProgress",
    }