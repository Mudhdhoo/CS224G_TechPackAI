# routs_sheets.py

from fastapi import APIRouter, Request, HTTPException
from backend.sheets.excel_editor import edit_specific_sheet  # <-- We'll import our function here

router = APIRouter()

@router.post("/chat-edit-excel")
async def chat_edit_excel(request: Request):
    """Reads a JSON body containing instructions, then calls GPT to edit an Excel file."""
    data = await request.json()
    instructions = data.get("instructions", None)
    if not instructions:
        raise HTTPException(status_code=400, detail="Missing 'instructions'")

    # Example usage:
    input_file = "/path/to/input.xlsx"
    output_file = "/path/to/output.xlsx"
    sheet_name = "TWO"

    try:
        edit_specific_sheet(
            input_path=input_file,
            output_path=output_file,
            sheet_name=sheet_name,
            prompt=instructions
        )
        return {"success": True, "message": f"Sheet '{sheet_name}' edited successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
