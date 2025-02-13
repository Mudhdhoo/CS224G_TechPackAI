
# Tech Pack Assistant for Fashion Designers

A powerful AI-assisted tool for creating detailed technical packs for fashion design and manufacturing.

## Overview

In the fashion industry, a Tech Pack serves as a crucial blueprint that communicates design specifications to manufacturers, detailing everything from materials and measurements to construction techniques. This AI assistant streamlines the process by automating tasks such as generating size charts, technical sketches, and material lists, enhancing accuracy and speeding up workflow.

## Features

- AI-powered design analysis
- Automated material suggestions
- Technical specification generation
- Real-time manufacturer communication
- Integrated with Supabase for secure data storage

## Installation and Setup

### Prerequisites

- Python 3.8 or higher
- Node.js and npm/yarn
- Supabase account

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Mac/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the development server:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on http://localhost:8000

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Project Structure

```
project/
├── backend/
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── utils.py
│   │   └── prompts.py
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
├── supabase/
│   └── functions/
│       └── process-chat/
│           └── index.ts
└── src/
    ├── components/
    ├── pages/
    └── ...
```

## Local Development

For local development, the system uses a Python FastAPI backend server that handles AI processing. The Supabase Edge Function forwards requests to this local server. Make sure the Python backend is running (`python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`) before using the application in development mode.

## Environment Variables

The application uses Supabase for secure storage of API keys and configuration:
- OpenAI API Key
- Supabase credentials
- Other configuration settings

No local `.env` file is required as all necessary credentials are managed through Supabase.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
