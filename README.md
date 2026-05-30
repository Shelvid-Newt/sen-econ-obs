# Senegal Economic Observatory

A Next.js dashboard and API for macro-economic data of Senegal, based on the DPEE (Direction de la Prévision et des Études Économiques) Monthly Economic Dashboard (TBO).

## Architecture

This project is structured into two main components:
- **Data Pipeline**: Python scripts (`quantitative_research/`) to extract, clean, and structure economic data from raw Excel files.
- **Web Application**: Next.js (App Router) application (`frontend/`) serving a REST API and a D3.js powered interactive dashboard.
  - Framework: Next.js 16 (React 19)
  - Database: PostgreSQL (Neon Serverless) with Drizzle ORM
  - Visualizations: D3.js

## Directory Structure

- `/raw_data` - Source data files (Excel format)
- `/quantitative_research` - Python data extraction and transformation scripts
- `/frontend/src/app` - Next.js application routes and pages
- `/frontend/src/app/api` - REST API endpoints (`/series`, `/kpis`, `/prices`, `/indicators`)
- `/frontend/src/lib/db` - Database schema definitions and client configuration
- `/frontend/src/components` - React components and custom D3 visualizations

## Local Environment Setup

### 1. Database Configuration
Create a `.env.local` file in the `frontend/` directory with your PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

## License
MIT License. 
Source data: DPEE (Public Domain).
