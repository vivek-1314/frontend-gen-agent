from langchain_core.messages import SystemMessage, HumanMessage
from src.llm import llm
from src.app.file_tools import write_file
from src.app.state import State
from pydantic import BaseModel
from src.app.prompt import page_generator_prompt
import src.app.ws_context as ctx


class PageCodeOutput(BaseModel):
    code: str


async def page_generator_node(state: State) -> State:

    blueprint = state["blueprint"].pages
    page_index = state["page_index"]

    pages = list(blueprint.keys())

    if page_index >= len(pages):
        print("All pages generated ✅")
        return {"page_status": "Done"}

    page_name = pages[page_index]
    sections = blueprint[page_name]
    prompt = page_generator_prompt()

    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=(
            f"Page Definition:\n"
            f"Page: {page_name}\n"
            f"Only import from these exact section names (no others): {sections}\n\n"
            f"Write the page. File path: app/{page_name.lower()}/page.tsx"
        )),
    ]

    response = llm(state["api_key"]).with_structured_output(PageCodeOutput).invoke(messages)

    if page_name.lower() == "home":
        path = "app/page.tsx"
    else:
        path = f"app/{page_name.lower()}/page.tsx"

    # Manually write the file in testing mode, comment out for production
    # write_file.invoke({
    #     "path": path,
    #     "content": response.code,
    # })

    # Send the file update through WebSocket
    ws = ctx.current_ws 
    if ws:
        await ws.send_json({
            "type": "file_update",
            "path": path,
            "content": response.code
        })

    return {
        "page_index": page_index + 1,
        "page_status": "InProgress",
    }