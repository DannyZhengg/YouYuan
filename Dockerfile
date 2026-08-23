FROM python:3.11-slim
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python src/data/preprocess.py && python src/embeddings/embed.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]