from langchain_groq import ChatGroq
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq

def llm(api_key: str) -> ChatGroq:
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key
    )