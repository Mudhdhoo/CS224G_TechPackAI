# routs_sheets.py

from fastapi import APIRouter, Request, HTTPException
from sheets.excel_editor import edit_specific_sheet  # <-- We'll import our function here

def chat_edit_excel():
    """Reads a JSON body containing instructions, then calls GPT to edit an Excel file."""
    instructions = 'Make some random edits. Surprise me. All the power lies in your hands.'

    # Example usage:
    input_file = "./test_techpack.xlsx"
    output_file = "/output.xlsx"


    edit_specific_sheet(
        input_path=input_file,
        output_path=output_file,
        prompt=instructions
    )
    return {"success": True, "message": f"Edited successfully."}

    

chat_edit_excel()