# Portfolio Backend

> A robust Flask-based backend service powering a personal portfolio website with features including chat functionality, skills endorsement system, and comprehensive metrics tracking.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Endpoints](#api-endpoints)
- [Monitoring](#monitoring)
- [Contact](#contact)

## Overview

This backend service is designed to power a modern portfolio website with advanced features and robust monitoring capabilities.

Key features:

- Interactive Chat System with LLM Integration
- Skills Endorsement System with Email Verification
- Contact Form Management
- Comprehensive Metrics and Monitoring
- Containerized Deployment Support
- MongoDB Integration
- Prometheus Metrics Export

## Architecture

The application follows a microservices architecture pattern with the following components:

- Flask REST API Server
- MongoDB Database
- Redis Cache (for OTP management)
- LLM Integration for Chat
- Prometheus Metrics
- Docker Containerization

## Technology Stack

| Category           | Technologies                                    |
|-------------------|------------------------------------------------|
| **Backend**       | Python, Flask, Flask-CORS                       |
| **Database**      | MongoDB, Redis                                  |
| **AI/ML**         | LLM Integration (via litellm)                   |
| **Containerization**| Docker, Docker Compose                        |
| **CI/CD**         | Jenkins                                         |
| **Monitoring**    | Prometheus                                      |
| **Testing**       | Pytest, Pytest-asyncio                          |
| **Security**      | OTP System, Email Verification                  |

## Repository Structure

```
portfolio-backend/
├── app.py              # Main application file
├── models.py           # Data models and schemas
├── mongo.py           # MongoDB integration
├── llm.py             # LLM integration logic
├── requirements.txt   # Python dependencies
├── Dockerfile         # Main service container
├── Dockerfile.test    # Testing container
├── docker-compose.yml # Service orchestration
├── db-compose.yml     # Database orchestration
├── jenkinsfile        # CI/CD pipeline
├── tests/             # Test suite
└── external_context/  # External context for LLM
```

## Prerequisites

- Python 3.8+
- Docker and Docker Compose
- MongoDB
- Redis
- Environment variables:
  - MongoDB connection details
  - Redis configuration
  - LLM API keys
  - Email service credentials

## Getting Started

1. **Clone the Repository**

```bash
git clone https://gitlab.com/tomer-edelsberg/portfolio-backend.git
cd portfolio-backend
```

2. **Set Up Environment Variables**

Create a `.env` file with required configurations:

```bash
MONGODB_URI=<your-mongodb-uri>
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
LLM_API_KEY=<your-llm-api-key>
EMAIL_USERNAME=<email-service-username>
EMAIL_PASSWORD=<email-service-password>
```

3. **Run with Docker Compose**

```bash
docker-compose up -d
```

4. **Run Tests**

```bash
docker-compose -f docker-compose.yml -f Dockerfile.test up
```

## CI/CD Pipeline

The project uses Jenkins for continuous integration and deployment with the following stages:

1. Code Checkout
2. Build
3. Test
4. Security Scan
5. Deploy

## API Endpoints

- `/api/chat` - Chat functionality
- `/api/contact` - Contact form submission
- `/api/get-projects` - Retrieve projects
- `/api/get-skills` - Get skills list
- `/api/get-about` - About information
- `/api/endorsements/*` - Endorsement system endpoints
- `/metrics` - Prometheus metrics
- `/healthz` - Health check
- `/readyz` - Readiness check

## Monitoring

The application exports various Prometheus metrics including:

- LLM usage statistics
- Conversation metrics
- Endorsement system metrics
- API usage metrics
- System health metrics

## Contact

Tomer Edelsberg
- Email: tomeredel@gmail.com
- LinkedIn: [Tomer Edelsberg](https://www.linkedin.com/in/tomer-edelsberg/)
- Gitlab: https://gitlab.com/tomer-edelsberg/portfolio-backend.git