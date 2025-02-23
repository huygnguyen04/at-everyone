from openai import OpenAI 
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) 

def create_wrapped_commentary(metric):
    
    prompt = (
        f"Here is a chatting metric: {metric}. "
        "Pretend you're narrating a Spotify Wrapped–style recap. "
        "Provide a lively, fun commentary that highlights this stat in a personal way. "
        "Be concise, but give it some personality."
        "Make it one sentence long."
    )
    
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "developer", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens= 100
    )
    
    commentary = completion.choices[0].message.content.strip()
    return commentary 