FROM python:3.11

ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/Pipfile backend/Pipfile.lock ./

RUN pip install pipenv && \
    pipenv install --system && \
    apt-get update && \
    apt-get install -y make

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7000"]