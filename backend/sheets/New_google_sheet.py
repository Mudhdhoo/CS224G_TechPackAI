import os
import re
import requests
import openpyxl

import gspread
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request

# Path to your service account JSON file
SERVICE_ACCOUNT_FILE = os.path.join(
    os.path.dirname(__file__),
    "teckpack-a282b3ecc292-1.json"
)

# Add DRIVE read-only scope so we can export the file
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly"
]

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


def parse_file_id(spreadsheet_url):
    """
    Extract the file ID from a Google Sheets URL of the form:
    https://docs.google.com/spreadsheets/d/<FILE_ID>/edit...
    """
    match = re.search(r"/d/([^/]+)/", spreadsheet_url)
    if not match:
        raise ValueError(f"Could not parse file ID from URL: {spreadsheet_url}")
    return match.group(1)

def download_spreadsheet_as_excel(spreadsheet_url, local_file_path):
    """
    Downloads the entire spreadsheet as an .xlsx file to local_file_path.
    
    'spreadsheet_url': Full Google Sheets link (e.g. https://docs.google.com/spreadsheets/d/FILE_ID/edit)
    'local_file_path': Where to save the .xlsx file
    """
    # Set up credentials so we can call the Drive export endpoint
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    creds.refresh(Request())  # Ensure we have a valid access token
    
    token = creds.token
    file_id = parse_file_id(spreadsheet_url)

    export_url = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=xlsx"

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(export_url, headers=headers)
    response.raise_for_status()  # Raise an error if the request failed

    with open(local_file_path, "wb") as f:
        f.write(response.content)

def update_sheet_from_local_excel(spreadsheet_url, worksheet_name, local_file_path):
    """
    Reads a local .xlsx file and replaces the contents of the specified
    worksheet with the data from that Excel file.
    
    'spreadsheet_url': Full Google Sheets link
    'worksheet_name': e.g. "Sheet1"
    'local_file_path': Path to the .xlsx file containing the new data
    """
    # 1) Open the local Excel file
    wb = openpyxl.load_workbook(local_file_path)
    # By default, we’ll take the first sheet in the .xlsx file,
    # or pick a named sheet if you prefer:
    ws = wb.active

    # 2) Convert all rows to a 2D list
    # (openpyxl returns rows as tuples, which are not directly
    #  suitable for gspread.update)
    data = []
    for row in ws.iter_rows(values_only=True):
        # 'row' is a tuple of cell values
        data.append(list(row) if row else [])

    # 3) Clear the target worksheet and update it with new data
    client = get_gs_client()
    sheet = client.open_by_url(spreadsheet_url).worksheet(worksheet_name)
    sheet.clear()             # Remove existing content
    sheet.update("A1", data)  # Write the new data starting at A1

# def insert_local_image(spreadsheet_url, worksheet_name, cell_address, local_image_path, width=None, height=None):
#     """
#     Inserts a local image file into a specific cell of the given worksheet.

#     spreadsheet_url: The full Google Sheets URL
#     worksheet_name:  Name of the target worksheet/tab (e.g., 'Sheet1')
#     cell_address:    A string like 'B2', indicating where to anchor the image
#     local_image_path: Path to your local image file (e.g., 'images/logo.png')
#     width, height:   Optional pixel dimensions for the inserted image
#     """
#     client = get_gs_client()
#     sheet = client.open_by_url(spreadsheet_url).worksheet(worksheet_name)
#     # gspread supports either a URL or a local file path for insert_image
#     # width and height are optional; if omitted, the default size is used
#     sheet.insert_image(local_image_path, cell_address, width=width, height=height)

def insert_local_image(spreadsheet_url, worksheet_name, cell_address, local_image_path, width=None, height=None):
    client = get_gs_client()
    sheet = client.open_by_url(spreadsheet_url).worksheet(worksheet_name)
    sheet.insert_image(local_image_path, cell_address, width=width, height=height)


