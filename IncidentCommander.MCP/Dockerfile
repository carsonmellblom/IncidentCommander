# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY src/ ./src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV API_BASE_URL=http://api:5294

# Start the MCP server using stdio transport
# We use -u for unbuffered output to ensure logs appear correctly in Docker
CMD ["python", "-u", "-m", "src.incident_commander_mcp.server"]
