Schema Sync – AI-Powered Data Integration for Financial Institutions
<div align="center"> <img src="frontend/images/SchemaSyncLogo.png" alt="Schema Sync Logo" width="120" height="120"> <h3>Schema Sync – The AI Copilot for Data Integration</h3> <p><em>Unifying financial data across institutions with intelligence, transparency, and speed</em></p> </div>
🌟 Overview

When two banks merge, data chaos follows. Different schemas, formats, and column names make integration slow and error-prone.
Schema Sync fixes that — it’s an AI-powered copilot that automatically maps, merges, and validates financial datasets from multiple sources, producing a single unified schema with full audit trails and confidence scoring.

It’s like GitHub Copilot — but for data mapping and schema reconciliation.

🎯 Key Features

🤖 AI-Driven Schema Matching – Uses NLP and similarity search (OpenAI embeddings) to match fields across institutions

📊 Multi-Format Support – Supports Excel, CSV, and JSON files from multiple banks or vendors

🔄 Real-Time Mapping Workspace – Interactive visual UI with confidence scores and drag-and-drop overrides

📈 Analytics Dashboard – Data quality KPIs, completeness scores, overlaps, and conflict summaries

📁 Unified Output Generator – Merges data into a clean master schema ready for analysis

🧾 Integration Report Builder – Auto-generates mapping documentation and visual analytics snapshots (PDF/Excel)

🛡️ Secure Local Processing – All data handled locally; no cloud uploads required

🎨 Modern UI/UX – Smooth, Power BI-style workspace with Notion-like simplicity

🏗️ Architecture
Backend (Python + FastAPI)

Schema Parser – Extracts and normalizes columns from uploaded bank datasets

AI Matcher – Embedding-based schema alignment using OpenAI or SBERT

Conflict Resolver – Detects mismatches and suggests resolutions with confidence scores

Merge Engine – Combines aligned datasets into a unified master table

Report Generator – Exports Excel, CSV, JSON, and PDF reports with visual analytics

Storage Layer – Organized folders per institution for clean separation and traceability

Frontend (Next.js + React + Tailwind + shadcn/ui)

Step-Based Workflow – Upload → Map → Merge → Analyze → Export

Drag-and-Drop Upload – Intuitive multi-file upload containers for Bank A & Bank B

Mapping Workspace – Side-by-side field comparison with connecting lines

Analytics Dashboard – Power BI-style visuals: KPIs, pie charts, completeness scores

Export Panel – One-click Excel and report generation

🚀 Quick Start
Prerequisites

Python 3.11+

Node.js 18+

OpenAI API Key

1️⃣ Clone and Setup
git clone https://github.com/your-username/schema-sync.git
cd schema-sync

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

2️⃣ Configure Environment
cp env.example .env
OPENAI_API_KEY=your_openai_api_key_here
FASTAPI_PORT=8001

3️⃣ Run the App
# Terminal 1
cd backend
uvicorn main:app --reload --port 8001

# Terminal 2
cd frontend
npm run dev

4️⃣ Access the Platform

Frontend: http://localhost:3000

Backend API: http://localhost:8001

Health Check: http://localhost:8001/health

🧭 Usage Guide
🧩 1. Upload Schemas

Upload master schemas for each bank.

Schema Sync auto-detects fields, types, and format differences.

🧠 2. AI Mapping

AI matcher suggests column pairings with confidence scores.

Drag or confirm mappings manually as needed.

🔄 3. Merge Preview

View unified table and highlight conflicts or missing data.

Real-time metrics: records merged, overlap %, unresolved fields.

📊 4. Analytics

Completeness Score Dashboard – visual credit-score-style indicator of data quality.

Cross-filtered charts for region, institution, and account type.

📤 5. Export

Download merged Excel/CSV or generate an Integration Report (PDF) with mappings, scores, and visuals.

🔧 API Endpoints
Method	Endpoint	Description
GET	/health	Server status
POST	/schemas/parse	Parse uploaded schema
POST	/upload	Upload data files
POST	/process/ai-map	Trigger AI mapping
GET	/download/<filename>	Retrieve merged output
POST	/cleanup	Remove temporary files
🛠️ Development
Project Structure
schema-sync/
├── backend/
│   ├── main.py
│   ├── parser.py
│   ├── matcher.py
│   ├── merger.py
│   ├── requirements.txt
│   └── uploaded_files/
│       ├── bankA/
│       └── bankB/
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── public/images/
│   ├── styles/
│   └── package.json
├── reports/
├── .env
└── README.md

Common Commands
# Backend
uvicorn main:app --reload --port 8001

# Frontend
npm run dev

# Install dependencies
pip install -r backend/requirements.txt
npm install

🔒 Security & Privacy

Local Processing Only – No data sent to third parties

Auto Cleanup – Temporary files deleted after export

Input Validation – Strict type & size checks

API Key Protection – Stored securely in environment variables

Error Sanitization – No sensitive data in logs

🐛 Troubleshooting
Issue	Fix
Backend not starting	Check Python version ≥ 3.11 and install requirements
Frontend blank page	Clear cache / run npm run dev
AI mapping fails	Ensure OPENAI_API_KEY is valid
File not parsed	Use CSV or Excel files ≤ 50 MB
🤝 Contributing

Fork the repo

Create a branch → git checkout -b feature/new-feature

Make changes + add comments

Commit → git commit -m "Add feature"

Push → git push origin feature/new-feature

Open a Pull Request

📄 License

Licensed under the MIT License – see LICENSE
.

📞 Support & Contact

GitHub Issues: Schema Sync Repo

Email: support@schemasync.ai

Website: schemasync.ai

<div align="center"> <p><strong>Schema Sync</strong> – Bridging data across banks with AI and trust.</p> <p>Built with ❤️ at Hack the Valley X 2025</p> </div>
