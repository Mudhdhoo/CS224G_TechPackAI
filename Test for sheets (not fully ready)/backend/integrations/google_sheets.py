# backend/integrations/google_sheets.py

import os
import gspread
from google.oauth2.service_account import Credentials

# Path to your service account JSON file.
# Adjust the path if needed (e.g., if it's in another directory).
SERVICE_ACCOUNT_FILE = os.path.join(
    os.path.dirname(__file__), 
    "../techpack-ai-2023d8b3cc82.json"
)

# Sheets read/write scope
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def get_gs_client():
    """Returns an authenticated gspread client using service account credentials."""
    creds = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, 
        scopes=SCOPES
    )
    return gspread.authorize(creds)

def read_sheet(spreadsheet_url, worksheet_name="Sheet1"):
    """Read all rows from a worksheet."""
    client = get_gs_client()
    sheet = client.open_by_url(spreadsheet_url).worksheet(worksheet_name)
    return sheet.get_all_values()

def write_cell(spreadsheet_url, worksheet_name="Sheet1", row=1, col=1, value="New Value"):
    """Write a single cell value for demonstration."""
    client = get_gs_client()
    sheet = client.open_by_url(spreadsheet_url).worksheet(worksheet_name)
    sheet.update_cell(row, col, value)
