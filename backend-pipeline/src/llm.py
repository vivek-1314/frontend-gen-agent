from langchain_groq import ChatGroq
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b"
)
