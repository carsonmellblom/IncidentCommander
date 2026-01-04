"""MCP Server for Incident Commander - AI Agent Interface (FastMCP)"""
import os
from dotenv import load_dotenv
from fastmcp import FastMCP

from .api_client import IncidentCommanderClient
from . import tools


# Load environment variables
load_dotenv()

# Initialize API client
api_client = IncidentCommanderClient()

# Create FastMCP server
mcp = FastMCP("Incident Commander")


@mcp.tool()
async def check_health() -> dict:
    """
    Check the current health status of the Incident Commander system.
    
    Returns system status and active incident details if any.
    """
    return await tools.check_health(api_client)


@mcp.tool()
async def query_logs(incident_id: int | None = None) -> dict:
    """
    Query recent incident logs from the system.
    
    Args:
        incident_id: Optional incident ID to query logs for. If not provided, uses current active incident.
    
    Returns logs and incident information.
    """
    return await tools.query_logs(api_client, incident_id)


@mcp.tool()
async def restart_service(service_name: str, incident_id: int) -> dict:
    """
    Restart a service to remediate incidents.
    
    Args:
        service_name: Name of the service to restart (currently only 'database' is supported)
        incident_id: ID of the incident to resolve
    
    Returns resolution status and details.
    """
    return await tools.restart_service(api_client, service_name, incident_id)


if __name__ == "__main__":
    # Check transport mode from environment variable
    transport = os.getenv("TRANSPORT", "stdio").lower()
    
    if transport == "sse":
        # HTTP/SSE transport for Docker/production
        import uvicorn
        
        port = int(os.getenv("PORT", "8000"))
        host = os.getenv("HOST", "0.0.0.0")
        
        print(f"Starting MCP server with SSE transport on {host}:{port}")
        mcp.run(transport="sse", host=host, port=port)
    else:
        # Stdio transport for local development
        print("Starting MCP server with stdio transport")
        mcp.run()
