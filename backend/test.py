from google import genai
from pydantic import BaseModel
class A(BaseModel):
    b: str
client = genai.Client(api_key='fake')
config = {'response_mime_type': 'application/json', 'response_schema': A.model_json_schema()}
print(config)
