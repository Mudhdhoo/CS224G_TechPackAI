my_project/
├─ .gitignore                # Exclude sensitive files (e.g., service_account.json)
├─ environment.yml           # Python dependencies (if using Conda)
├─ service_account.json      # Google Cloud service account credentials (DO NOT commit)
├─ backend/
│  ├─ main.py                # FastAPI app entry point
│  ├─ routes.py              # API endpoints for sheet data
│  └─ integrations/
│     └─ google_sheets.py    # Google Sheets integration code
└─ frontend/
   ├─ package.json           # React app dependencies and scripts
   └─ src/
      ├─ App.js              # Main React component (with routing)
      └─ pages/
         └─ GoogleSheetEmbed.jsx  # Embeds the Google Sheet in an iframe


SETUP:

    conda env create -f environment.yml
    conda activate my_project_env

Fast API:
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

Frontend:
    cd frontend
    npm install

    npm start
