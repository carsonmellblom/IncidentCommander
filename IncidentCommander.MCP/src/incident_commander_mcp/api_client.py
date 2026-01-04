"""API client for interacting with the .NET Incident Commander API"""
import httpx
import os
from typing import Optional, List, Dict, Any


class IncidentCommanderClient:
    """HTTP client for .NET Incident Commander API"""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("API_BASE_URL", "http://localhost:5294")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=10.0)
    
    async def get_current_incident(self) -> Dict[str, Any]:
        """Get the current active incident"""
        response = await self.client.get("/api/incidents/current")
        response.raise_for_status()
        return response.json()
    
    async def get_incident_logs(self, incident_id: int) -> List[Dict[str, Any]]:
        """Get logs for a specific incident"""
        response = await self.client.get(f"/api/incidents/{incident_id}/logs")
        response.raise_for_status()
        return response.json()
    
    async def resolve_incident(self, incident_id: int, resolved_by: str) -> Dict[str, Any]:
        """Resolve an incident"""
        response = await self.client.patch(
            f"/api/incidents/{incident_id}/resolve",
            json={"resolvedBy": resolved_by}
        )
        response.raise_for_status()
        return response.json()
    
    async def add_log(self, incident_id: int, level: str, message: str) -> Dict[str, Any]:
        """Add a log entry to an incident"""
        # Map level string to integer (0=Info, 1=Warning, 2=Error)
        level_map = {"Info": 0, "Warning": 1, "Error": 2}
        response = await self.client.post(
            f"/api/incidents/{incident_id}/logs",
            json={"level": level_map.get(level, 0), "message": message}
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
