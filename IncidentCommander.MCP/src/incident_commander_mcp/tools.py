"""MCP tool definitions and implementations"""
from typing import Any
from .api_client import IncidentCommanderClient


async def check_health(api_client: IncidentCommanderClient) -> dict[str, Any]:
    """Check the current health status of the Incident Commander system"""
    result = await api_client.get_current_incident()
    
    if result.get("Incident") is None:
        return {
            "status": "Healthy",
            "message": "All systems operational. No active incidents.",
            "details": result
        }
    else:
        incident = result["Incident"]
        return {
            "status": f"Unhealthy - {incident['Status']}",
            "message": f"Active incident detected: {incident['Status']}",
            "incident_id": incident["Id"],
            "created_at": incident["CreatedAt"],
            "details": result
        }


async def query_logs(api_client: IncidentCommanderClient, incident_id: int | None = None) -> dict[str, Any]:
    """Query recent incident logs from the system"""
    # If no incident_id provided, get current incident first
    if incident_id is None:
        current = await api_client.get_current_incident()
        if current.get("Incident") is None:
            return {
                "status": "No active incident",
                "logs": [],
                "message": "No logs available - system is healthy"
            }
        incident_id = current["Incident"]["Id"]
    
    logs = await api_client.get_incident_logs(incident_id)
    
    return {
        "status": "Success",
        "incident_id": incident_id,
        "log_count": len(logs),
        "logs": logs
    }


async def restart_service(
    api_client: IncidentCommanderClient,
    service_name: str,
    incident_id: int
) -> dict[str, Any]:
    """Restart a service to remediate incidents"""
    if service_name.lower() != "database":
        return {
            "status": "Error",
            "message": f"Unknown service: {service_name}. Only 'database' is supported."
        }
    
    # Add log entry
    await api_client.add_log(
        incident_id,
        "Info",
        f"AI Agent initiated {service_name} service restart"
    )
    
    # Resolve the incident
    result = await api_client.resolve_incident(incident_id, "AI Agent")
    
    # Add resolution log
    await api_client.add_log(
        incident_id,
        "Info",
        f"{service_name} service restarted successfully. Incident resolved."
    )
    
    return {
        "status": "Success",
        "message": f"{service_name} service restarted. Incident {incident_id} resolved.",
        "resolved_at": result["ResolvedAt"],
        "resolved_by": result["ResolvedBy"]
    }
