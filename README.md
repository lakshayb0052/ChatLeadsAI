# ChatLeads AI 🚀

ChatLeads AI is a powerful, automated lead intelligence platform that extracts leads directly from multiple WhatsApp sessions in real-time. It uses AI to score leads and provides a professional dashboard for monitoring and exporting data.

## 🌟 Features

- **Multi-Session WhatsApp Fleet**: Connect and manage multiple WhatsApp accounts simultaneously.
- **AI-Powered Extraction**: Automatically identifies names, emails, and mobile numbers from chat messages.
- **Lead Scoring**: Intelligent categorization of leads (Hot, Warm, Cold) based on interaction content.
- **Real-Time Analytics**: Live war room dashboard with WebSocket-powered updates.
- **Excel Export**: Download your captured leads into professional Excel reports.
- **Modern UI**: Sleek, dark-mode interface built with Next.js and Tailwind CSS.

## 🏗️ Architecture

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Python, SQLModel (PostgreSQL/SQLite).
- **Automation**: Custom WhatsApp session management.
- **AI**: Integration with OpenAI and Anthropic for intelligent parsing.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment

### Backend (Render)
- Deploy as a Web Service.
- Set `PORT` environment variable.
- Connect to a PostgreSQL database.

### Frontend (Vercel)
- Deploy the `frontend` directory.
- Set `NEXT_PUBLIC_API_URL` to your Render backend URL.

## 📄 License

MIT License.
