import openai
import os
import json
from openai import OpenAI

client = OpenAI()

def edit_data_with_openai(prompt, data_json, model="gpt-4-turbo", temperature=0.7):
    data_json_str = json.dumps(data_json, indent=2)
    full_prompt = (
        f"{prompt}\n\nData:\n{data_json_str}\n\n"
        "Respond ONLY with valid JSON data. Never include markdown, explanations, or extra text."
    )

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You edit structured JSON data based strictly on the user's instructions "
                    "and return only updated data in valid JSON format. Never add explanations or other content."
                )
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=temperature,
    )

    # Parse JSON response
    try:
        return json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError as e:
        raise ValueError(
            f"GPT response is not valid JSON: {e}\n\nResponse was:\n{response.choices[0].message.content.strip()}"
        )
