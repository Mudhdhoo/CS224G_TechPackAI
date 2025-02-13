I willl fill in later


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