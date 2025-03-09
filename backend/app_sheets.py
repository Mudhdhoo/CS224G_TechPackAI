# app.py
from fastapi import FastAPI, Request, HTTPException
from sheets.excel_editor import edit_specific_sheet  # or your actual import path

app = FastAPI()

@app.post("/sheet/chat-edit-excel")
async def chat_edit_excel(request: Request):
    """
    Temporary route to test GPT-based Excel editing.
    Expects JSON { "instructions": "...some instructions..." }
    """
    data = await request.json()
    instructions = data.get("instructions")
    if not instructions:
        raise HTTPException(status_code=400, detail="Missing 'instructions' in JSON body")

    # Paths to your Excel file(s)
    input_file = "/absolute/path/to/input.xlsx"
    output_file = "/absolute/path/to/output.xlsx"
    sheet_name = "TWO"

    try:
        # Call your GPT-based edit function
        edit_specific_sheet(
            input_path=input_file,
            output_path=output_file,
            sheet_name=sheet_name,
            prompt=instructions
        )
        return {"success": True, "message": f"Edited sheet '{sheet_name}' successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run with: python app.py
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
