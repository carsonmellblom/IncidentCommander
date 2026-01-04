# Incident Commander MCP Server

Model Context Protocol (MCP) server for AI agents to interact with the Incident Commander system. Built with **FastMCP** for production-ready AI integration.

## Features

- **check_health**: Query system status and active incidents
- **query_logs**: Retrieve incident logs
- **restart_service**: Remediate incidents by restarting services

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `env.example` to `.env` and update:
```
API_BASE_URL=http://localhost:5294
```

## Usage

### Run the MCP server

```bash
python -m src.incident_commander_mcp.server
```

The server runs with stdio transport for AI agent communication.

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector python -m src.incident_commander_mcp.server
```

This opens a web UI to test MCP tools interactively.

## Tool Reference

### check_health

Check system health status.

**Returns**:
```json
{
  "status": "Healthy" | "Unhealthy - DatabaseFailure",
  "message": "All systems operational",
  "incident_id": 123
}
```

### query_logs

Query incident logs.

**Parameters**:
- `incident_id` (int, optional): Incident ID to query. If not provided, uses current active incident.

**Returns**:
```json
{
  "status": "Success",
  "incident_id": 123,
  "log_count": 5,
  "logs": [...]
}
```

### restart_service

Restart a service to resolve incidents.

**Parameters**:
- `service_name` (str): Service to restart (currently only "database")
- `incident_id` (int): Incident to resolve

**Returns**:
```json
{
  "status": "Success",
  "message": "database service restarted. Incident 123 resolved.",
  "resolved_at": "2026-01-03T02:30:00Z",
  "resolved_by": "AI Agent"
}
```

## Architecture

```
AI Agent (e.g., Azure AI)
    ↓ (MCP stdio)
FastMCP Server (Python)
    ↓ (HTTP)
.NET API
    ↓
PostgreSQL Database
```

Both the dashboard and AI agents share the same database state for incident tracking.

## Why FastMCP?

This server uses [FastMCP](https://github.com/jlowin/fastmcp) (v2.14+) instead of the vanilla MCP SDK for:

- ✅ **Simpler API**: Decorator-based tool registration
- ✅ **Production-ready**: Enterprise features built-in
- ✅ **Better DX**: Less boilerplate, cleaner code
- ✅ **Active development**: Latest MCP specification support
