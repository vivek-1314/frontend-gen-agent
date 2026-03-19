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
        return in this format:
          pages: Dict[str, List[str]]
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

        Intent: {intent}
        Blueprint: {blueprint}
        user_prompt: {user_prompt}

        Generate a structured output where for each section, it has:
        - section: **name same as in blueprint**
        - props: dictionary with text/images/links (example: headline, description, image)
        """
    
    return prompt

def section_generator_prompt(section_input: dict):
    return f"""
        You are an elite UI engineer. Build visually stunning Next.js v16.1.6 sections.

        SECTION: {section_input['section']}
        MOTION: {section_input['motion']}
        
        RULES:
        - "use client" at top strictly at top of the file
        - Tailwind + Framer Motion (motion.div, variants, staggerChildren) — no CSS transitions

        "Create a premium, modern website section with a clean and minimal design. Use neutral colors, subtle gradients, and plenty of white space. The section should have:
        - A clear, elegant headline and subheadline
        - do not use images if not required but if required use placeholder images from unsplash with relevant keywords
        - Well-organized content blocks (text, icons, buttons)
        - Optional call-to-action button with subtle hover effect
        - Consistent spacing, alignment, and typography for readability
        - Visual hierarchy with featured content areas highlighted by gray skeletons
        - Aesthetic, professional, and minimal feel suitable for premium websites"
        - All props hardcoded as defaults — section must render standalone
        - anywhere using ease use  {{ease: "{{ease_value}}" as const}} because ts give error
        - Before returning the code, internally verify that the section would compile successfully in a Next.js + TypeScript project and that **no type errors would occur**.
        - Dont give anchor tag inside link tags.

        
        - Never use custom HTML tags (e.g. <story>, <section-wrapper>, <card>).
        - Only use standard HTML elements (div, section, article, main, p, h1–h6, span, etc.)

        All section components must use default export:
        export default function HeroSection() {{}}

        output:
        {{
            "code": "<React TSX code as plain text>"
        }}
        **no extra text np json np commas**.
        """ 

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

    Import sections based on the page's depth:
    - src/app/page.tsx → import X from "./Sections/X"
    - src/app/[route]/page.tsx → import X from "../Sections/X"

    OUTPUT: return single field containing the React TSX code.**no extra text np json np commas**.
    Ensure the code compiles in Next.js + TypeScript (no type errors).

    Always import sections as default imports (no curly braces):
    - import HeroSection from "./Sections/HeroSection"
    - NEVER: import {{HeroSection}} from "./Sections/HeroSection"
    """

    return prompt