import pandas as pd
from sheets.openai_client import edit_data_with_openai
from openpyxl import load_workbook

def load_excel(file_path, sheet_name):
    """Load a specific sheet from an Excel file into a DataFrame."""
    return pd.read_excel(file_path, sheet_name=sheet_name)

def save_excel(df, file_path, sheet_name):
    """Save the DataFrame to an Excel file on a specific sheet.
    If the file exists, update the sheet; otherwise, create a new file."""
    try:
        # Open the workbook and replace the specified sheet if it exists
        book = load_workbook(file_path)
        with pd.ExcelWriter(file_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    except FileNotFoundError:
        # If the file doesn't exist, create a new one
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)

def df_to_json(df):
    """Convert DataFrame to a JSON-compatible list of records."""
    return df.to_dict(orient='records')

def json_to_df(data_json):
    """Convert JSON data (list of records) back into a DataFrame."""
    return pd.DataFrame(data_json)

def edit_specific_sheet(input_path, output_path, prompt, sheet_name=0):
    # Load the target sheet from Excel into a DataFrame
    df = load_excel(input_path, sheet_name)
    
    # Convert the DataFrame into JSON format
    data_json = df_to_json(df)
    
    # Send JSON data + prompt to GPT and receive an edited JSON response
    edited_json = edit_data_with_openai(prompt, data_json)
    
    # Debugging: print the GPT JSON response
    print("GPT JSON Response:\n", edited_json)
    
    # Convert the JSON response back into a DataFrame
    edited_df = json_to_df(edited_json)
    
    # Save the updated DataFrame back into the specified Excel sheet
    save_excel(edited_df, output_path, sheet_name)
    print(f"✅ Sheet '{sheet_name}' edited and saved to {output_path}")
