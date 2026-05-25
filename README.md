# Staffrec MVP 🚀

Welcome to **Staffrec**, an AI-powered recruitment briefing platform! This platform enables recruiters to manage clients and candidates, automatically generate technical assessment briefs using AI, and manage interview assignments.

## 🏗️ Architecture

Staffrec is built with a modern, fully serverless architecture on AWS, ensuring maximum scalability and zero server maintenance:

### Frontend
- **Framework:** React + Vite + TypeScript
- **Styling:** TailwindCSS
- **Hosting:** AWS S3 + CloudFront (CDN)
- **Deployment:** Fully automated via GitHub Actions

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (AWS RDS Serverless)
- **AI Integration:** AWS Bedrock (`google.gemma-3-27b-it` model)
- **Email:** AWS SES (Simple Email Service)
- **Hosting:** AWS Lambda + API Gateway (Serverless)
- **Deployment:** Docker container pushed to AWS ECR, triggered by GitHub Actions

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v20+)
- Python (v3.11+)
- `uv` package manager (recommended for Python)

### 1. Backend Setup
The backend is designed to run securely in a virtual environment. We use SQLite for local development so you don't need a heavy database running on your laptop.

```bash
cd backend
# Create your local environment file
cp .env.example .env
```
Ensure your local `.env` has the following minimum variables:
```env
DATABASE_URL=sqlite:///./staffrec.db
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=google.gemma-3-27b-it
FRONTEND_ENDPOINT=http://localhost:5173
```
*Note: Your local AWS credentials must have Bedrock and SES permissions to test AI generation and emails.*

Run the backend:
```bash
uv run uvicorn app.main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install
# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`. 

*Note: The frontend automatically proxies to `http://localhost:8000` during local development via `VITE_API_URL` fallback.*

---

## 🚀 Deployment & Production Data

The application is deployed securely to Production using **GitHub Actions**.

### Pushing to Production
Whenever you `git push` to the `master` branch, GitHub Actions will automatically:
1. Build the frontend and deploy it to AWS CloudFront.
2. Build the backend Docker container, push it to ECR, and update the AWS Lambda function.

### Is Production Data Safe?
**Yes, 100% safe.** 
- Deploying the frontend or backend **does not** touch the production PostgreSQL database.
- The RDS Database operates completely independently of the application code. 
- You can push code updates to `master` fearlessly. The data (clients, candidates, briefs, users) will remain perfectly intact.

### AWS Secrets Needed for GitHub Actions
If you ever migrate or reset your GitHub repository, ensure these Repository Secrets are configured in GitHub Settings:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REGISTRY`
- `LAMBDA_FUNCTION_NAME`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL` (The live API Gateway URL)

---

## 🔐 Security Notes
- **Never push `.env` files to GitHub.** They are included in `.gitignore` by default.
- The backend uses JWT (JSON Web Tokens) for secure authentication.
- The Production AWS Lambda function relies on an IAM Execution Role for accessing Bedrock and SES. Temporary credentials (`AWS_SESSION_TOKEN`) are securely managed automatically by `boto3`.