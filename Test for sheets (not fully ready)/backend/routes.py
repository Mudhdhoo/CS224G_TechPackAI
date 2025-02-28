# backend/routes.py

from fastapi import APIRouter, HTTPException
from .integrations.google_sheets import read_sheet, write_cell

router = APIRouter()

# Example: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1jfPQ6k-8A-dD-8X6Mu5SwQsoKtQOWGDEoZalidI6Wec/edit?usp=sharing"

@router.get("/sheet-data")
def get_sheet_data():
    """Returns the entire sheet data as a list of rows."""
    try:
        data = read_sheet(SPREADSHEET_URL)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-cell")
def update_sheet_cell(row: int, col: int, value: str):
    """Update a specific cell in the sheet."""
    try:
        write_cell(SPREADSHEET_URL, row=row, col=col, value=value)
        return {"message": "Cell updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
