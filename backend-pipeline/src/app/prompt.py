def intent_node_prompt(user_prompt: str) -> str:
    intent_prompt = f"""
        Extract structured website intent from this prompt.

        User Prompt:
        {user_prompt}

        Rules:
        - Infer site_type.
        - Extract pages if mentioned.
        - If animations sound smooth/advanced → animation_level = high.
        - If animations sound basic → animation_level = low.
        - if theme is mentioned → extract theme. Otherwise default to "light".
        - Fixed tech_stack = "Next.js + Tailwind + Framer Motion"

        Never leave fields empty.
        """

    return intent_prompt

def blueprint_node_prompt(intent: dict, user_input: str) -> str:
        prompt = f"""
        You are a senior frontend architect.

        Based on this website intent:
        {intent}

        and user input:
        {user_input}

        Generate a structured blueprint showing which pages exist and which **sections** each page should have.
        Not more then 3 pages and 4 section per page **this is max limit not min** so if required less make less .

        pages name and sections name should be of one_word 
        examples : "herosection" or "footer"
        """

        return prompt

def section_planner_node_prompt(state: dict) -> str:
    intent = state["intent"]
    blueprint = state["blueprint"]
    user_prompt = state["user_prompt"]

    prompt = f"""
        You are a senior frontend architect. Plan a detailed and modular section structure for a website.
        You will receive the site intent, page blueprint

        Rules:
        - strictly make only section which are mention in blueprint so we can assemble section in pages later.
        - Every section must be self-contained and reusable with a single responsibility
        - Every section must have meaningful animations — match intensity to the animation_level in intent
        - Think in layers: Page → Section
        - Identify shared/reusable section across pages (Button, Card, SectionHeading etc.)

        Intent: {intent}
        Blueprint: {blueprint}
        user_prompt: {user_prompt}

        Generate a structured output where for each section, it has:
        - section: name same as from blueprint
        - props: dictionary with text/images/links (example: headline, description, image)
        """
    
    return prompt

def section_generator_prompt(section_input: dict):
    return f"""
        You are an elite UI engineer. Build visually stunning Next.js v16.1.6 sections.

        SECTION: {section_input['section']}
        MOTION: {section_input['motion']}
        
        RULES:
        - "use client" at top
        - Tailwind + Framer Motion (motion.div, variants, staggerChildren) — no CSS transitions

        "Create a premium, modern website section with a clean and minimal design. Use neutral colors, subtle gradients, and plenty of white space. The section should have:
        - A clear, elegant headline and subheadline
        - Well-organized content blocks (text, icons, buttons)
        - Optional call-to-action button with subtle hover effect
        - Consistent spacing, alignment, and typography for readability
        - Visual hierarchy with featured content areas highlighted by gray skeletons
        - Aesthetic, professional, and minimal feel suitable for premium websites"
        - All props hardcoded as defaults — section must render standalone
        - anywhere using ease use  {{ease: "{{ease_value}}" as const}} because ts give error
        - Before returning the code, internally verify that the section would compile successfully in a Next.js + TypeScript project and that **no type errors would occur**.
        - Dont give anchor tag inside link tags.

        OUTPUT: Return a tool call with this schema:
        {{
            "code": "<React TSX code as plain text>"
        }}
        Return ONLY the tool call, no extra text.
        """ 

def folder_struct_node_prompt():
    tech_stack = "Next.js + Tailwind + Framer Motion"
    site_type = "frontend website"
    
    prompt_text = f"""
        You are generating the front-end project for a SaaS site.
        
        You have access to these tools:
        - write_file(path: str, content: str) -> Save content to a file
        - read_file(path: str) -> Read content from a file
        - list_files() -> List all files in current folder
        - get_current_directory() -> Get current directory path

        Task:
        1. Decide the folder structure based on tech stack and blueprint.
        2. For each section/page, use write_file() to save it to the correct path.
        3. ALWAYS return **tool calls**, do not just output text. 
        4. Example tool usage: write_file("sections/Header.tsx", "<Header /> section code")

        You are generating a front-end project.
        - Always return a JSON array of tool calls.
        - Each tool call should have the form:
        {{"tool": "write_file", "arguments": {{"path": "...", "content": "..."}}}}
        - Only output JSON. No extra explanation.
        """

    return prompt_text

def page_generator_prompt():
    prompt = f"""
    You are an expert frontend engineer.

    Generate a modern **Next.js page using React + TailwindCSS + TypeScript**.

    Rules:
    - Import sections only from `/Sections`
    - Only use the sections listed
    - Do NOT create new sections
    - Compose the page using these sections 
    - Export default page component
    - All props hardcoded as defaults — so not pass props to sections
    - use system_plan to import the section in correct way
    - Clean layout and good use of whitespace and beautiful structured

    Example import:
    also use "use client" at the top of the file. if required
    write in files when importing something HeroSection from "./Sections/hero" *for home page only*
    write in files when importing something Footer from "../Sections/footer"  *for other's page*

    OUTPUT: return via the structured output tool with a single field containing the React TSX code (default export). No extra text.
    Ensure the code compiles in Next.js + TypeScript (no type errors).
    """

    return prompt