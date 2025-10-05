Schema Sync – AI-Powered Data Integration for Financial Institutions
<div align="center"> <img src="frontend/images/SchemaSyncLogo.png" alt="Schema Sync Logo" width="120" height="120"> <h3>Schema Sync – The AI Copilot for Data Integration</h3> <p><em>Unifying financial data across institutions with intelligence, transparency, and speed</em></p> <p><strong>Built for the EY Canada Data Integration Challenge – Hack the Valley X</strong></p> </div>
🌟 Overview

When two banks merge, data chaos follows. Each system has its own schema, column names, and formats — making integration a long, manual process.
Schema Sync is your AI-powered copilot that automatically maps, merges, and validates financial datasets across institutions, producing a unified schema and full audit trail — in minutes, not days.

It’s like GitHub Copilot — but for data mapping and schema reconciliation.

🎯 Key Features

🤖 AI Schema Matching – Embedding-based NLP matching using OpenAI for column alignment

📂 Multi-Format Uploads – Works with CSV, Excel (.xlsx, .xls), and JSON files

🧩 Visual Mapping Workspace – Two schemas side-by-side with drag-to-match + confidence scores

📈 Data Analytics Dashboard – Power BI–style insights with completeness scores, overlaps, and KPIs

⚙️ Conflict Resolver – Detects mismatched fields, missing data, and format inconsistencies

🧾 Report Generation – Auto-creates Excel and PDF reports with field mappings and confidence metrics

🛡️ Secure Local Processing – All data handled locally with full transparency

🎨 Elegant UI – Clean, modern interface built with Next.js, Tailwind, and shadcn/ui

🏗️ Architecture
Backend (FastAPI + Python)

Schema Parser – Reads and normalizes schema structure

AI Matcher – Uses embeddings (OpenAI/SBERT) for semantic field pairing

Merge Engine – Consolidates data into a unified master schema

Analytics Service – Computes completeness, conflicts, and overlap metrics

Report Generator – Produces Excel/PDF outputs with audit trail

Storage Layer – Organized directories per institution

Frontend (Next.js + React + Tailwind)

Step-Based Workflow – Guided stages: Upload → Map → Merge → Analyze → Export

Drag-and-Drop Uploads – Two containers for Bank A and Bank B datasets

Dynamic Mapping View – Real-time confidence visualization

Interactive Dashboard – Live KPIs, charts, and completeness scores

Responsive Design – Optimized for desktop, tablet, and mobile

🚀 Quick Start
Prerequisites

Python 3.11+

Node.js 18+

OpenAI API Key

1️⃣ Clone and Install
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
# Backend
cd backend
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm run dev

4️⃣ Access

Frontend: http://localhost:3000

Backend: http://localhost:8001

Health Check: http://localhost:8001/health

🧭 Usage Guide
Step 1 – Upload Schemas

Upload Bank A and Bank B schema files.

Schema Sync auto-detects columns, types, and structures.

Step 2 – AI Mapping

View auto-suggested column pairings with confidence scores.

Drag to adjust or approve mappings manually.

Step 3 – Merge Preview

Review unified dataset and flagged inconsistencies.

Live metrics: records merged, % overlap, fields unresolved.

Step 4 – Analytics Dashboard

Completeness Score gauge

Conflict summaries

Overlap and regional breakdown charts

Step 5 – Export

Download unified dataset (Excel/CSV)

Generate full Integration Report (PDF) with visual mappings and KPIs

🔧 API Endpoints
Method	Endpoint	Description
GET	/health	Server status
POST	/schemas/parse	Parse uploaded schema
POST	/upload	Upload data files
POST	/process/ai-map	Trigger AI schema mapping
GET	/download/<filename>	Download unified dataset
POST	/cleanup	Remove temporary files
🧱 Project Structure
schema-sync/
├── backend/
│   ├── main.py
│   ├── matcher.py
│   ├── merger.py
│   ├── parser.py
│   └── uploaded_files/
│       ├── bankA/
│       └── bankB/
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── public/images/
│   └── styles/
├── reports/
└── README.md

🔒 Security & Privacy

Local-Only Processing – No cloud upload

Strict Validation – File size/type checks

Auto Cleanup – Deletes temporary data after export

API Key Security – Stored in .env

Sanitized Logs – No sensitive data exposure

🐛 Troubleshooting
Issue	Solution
Backend fails to start	Reinstall dependencies, check Python 3.11+
Frontend blank page	Clear cache or rerun npm run dev
AI Mapping errors	Verify OPENAI_API_KEY is active
File not recognized	Use CSV or Excel under 50 MB
🤝 Contributing

Fork the repository

Create a feature branch → git checkout -b feature/new-feature

Commit changes → git commit -m "Add feature"

Push → git push origin feature/new-feature

Open a Pull Request

📄 License

Licensed under the MIT License – see LICENSE

📞 Contact

GitHub Issues: Schema Sync Repo

Email: support@schemasync.ai

Website: schemasync.ai

<div align="center"> <p><strong>Schema Sync</strong> – Bridging data across banks with AI and trust.</p> <p>Made with ❤️ at Hack the Valley X 2025</p> </div>
