from src.llm import llm
from src.app.file_tools import write_file
from langchain_core.messages import HumanMessage, SystemMessage
import json
import subprocess
import os


def folder_struct_node(state: dict):

    testing = False
    if(testing) :
        print("🚀 folder struct is generated in testing")
        return {
            **state
        }

    intent = state["intent"]
    output_dir = state.get("output_dir", "generated_project")

    messages = [
        SystemMessage(content="""You are a Next.js project scaffolder.
Return ONLY a JSON array of files to create. Nothing else. No explanation.
Format:
[
  {"path": "package.json", "content": "..."},
  {"path": ".gitignore", "content": "..."}
]
For empty folders, create a .gitkeep file inside them."""),
        HumanMessage(content=f"""
        intent: {intent}

        Return JSON array for a Next.js 14 project with:
        - TypeScript, Tailwind CSS, App Router
        - package.json, tsconfig.json, tailwind.config.ts, .gitignore
        - setup whole tailwind
        - src/app/layout.tsx and src/app/page.tsx (minimal only)
        - src/sections/.gitkeep  (empty folder)
        - src/pages/.gitkeep       (empty folder)
        """)
    ]

    response = llm.invoke(messages)

    try:
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        files = json.loads(raw.strip())

        for file in files:
            write_file.invoke({
                "path": file["path"],
                "content": file["content"]
            })
            print(f"✅ Created: {file['path']}")

        # Auto run npm install after files are created
        print("📦 Running npm install...")
        subprocess.run(
            ["npm", "install"],
            cwd=output_dir,       # runs inside your project folder
            check=True,
            shell=True            # needed for Windows
        )
        print("✅ npm install complete")

    except subprocess.CalledProcessError as e:
        print(f"❌ npm install failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

    return {**state}