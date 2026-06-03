# Use a lightweight Python image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Create a home directory for the user 'user' (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set working directory to user home
WORKDIR $HOME/app

# Copy and install requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of your app code
COPY --chown=user . .

# Expose the default Hugging Face port
EXPOSE 7860

# Start the FastAPI server on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]