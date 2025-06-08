FROM python:3.11-slim AS base

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY llm.py .
COPY models.py .
COPY mongo.py .
COPY external_context/ ./external_context

RUN chown -R appuser:appgroup /app

USER appuser

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

EXPOSE 5000
ENTRYPOINT ["flask", "run", "--host=0.0.0.0"]



FROM base AS test

USER root

# Install test dependencies directly
RUN pip install --no-cache-dir pytest

# Copy tests only
COPY tests/ /app/tests
RUN chown -R appuser:appgroup /app/tests

USER appuser

ENTRYPOINT ["pytest", "tests"]