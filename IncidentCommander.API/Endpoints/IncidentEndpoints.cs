using IncidentCommander.Infrastructure.Data;
using IncidentCommander.Infrastructure.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentCommander.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IncidentCommander.API.Endpoints;

public static class IncidentEndpoints
{
    public static void MapIncidentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/incidents");

        // GET /api/incidents/current - Get current active incident
        group.MapGet("/current", async ([FromServices] AppDbContext db) =>
        {
            var activeIncident = await db.Incidents
                .Where(i => i.ResolvedAt == null)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeIncident == null)
            {
                return Results.Ok(new { Status = "Healthy", Incident = (object?)null });
            }

            return Results.Ok(new
            {
                Status = activeIncident.Status.ToString(),
                Incident = new
                {
                    activeIncident.Id,
                    activeIncident.Status,
                    activeIncident.CreatedAt,
                    activeIncident.ResolvedAt,
                    activeIncident.ResolvedBy
                }
            });
        });

        // POST /api/incidents - Create new incident
        group.MapPost("/", async ([FromServices] AppDbContext db, [FromBody] CreateIncidentRequest request) =>
        {
            var incident = new Incident
            {
                Status = request.Status,
                CreatedAt = DateTime.UtcNow
            };

            db.Incidents.Add(incident);
            await db.SaveChangesAsync();

            return Results.Created($"/api/incidents/{incident.Id}", new
            {
                incident.Id,
                incident.Status,
                incident.CreatedAt
            });
        });

        // PATCH /api/incidents/{id}/resolve - Resolve an incident
        group.MapPatch("/{id}/resolve", async (int id, [FromServices] AppDbContext db, [FromBody] ResolveIncidentRequest request) =>
        {
            var incident = await db.Incidents.FindAsync(id);
            if (incident == null)
            {
                return Results.NotFound();
            }

            incident.ResolvedAt = DateTime.UtcNow;
            incident.ResolvedBy = request.ResolvedBy;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                incident.Id,
                incident.ResolvedAt,
                incident.ResolvedBy
            });
        });

        // GET /api/incidents/{id}/logs - Get logs for an incident
        group.MapGet("/{id}/logs", async (int id, [FromServices] AppDbContext db) =>
        {
            var logs = await db.IncidentLogs
                .Where(l => l.IncidentId == id)
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new
                {
                    l.Id,
                    l.Timestamp,
                    Level = l.Level.ToString(),
                    l.Message
                })
                .ToListAsync();

            return Results.Ok(logs);
        });

        // POST /api/incidents/{id}/logs - Add log to incident
        group.MapPost("/{id}/logs", async (int id, [FromServices] AppDbContext db, [FromServices] IHubContext<IncidentHub> hubContext, [FromBody] AddLogRequest request) =>
        {
            var incident = await db.Incidents.FindAsync(id);
            if (incident == null)
            {
                return Results.NotFound();
            }

            var log = new IncidentLog
            {
                IncidentId = id,
                Timestamp = DateTime.UtcNow,
                Level = request.Level,
                Message = request.Message
            };

            db.IncidentLogs.Add(log);
            await db.SaveChangesAsync();

            // Broadcast log via SignalR
            var levelPrefix = request.Level switch
            {
                IncidentLogLevel.Error => "[ERR]",
                IncidentLogLevel.Warning => "[WRN]",
                _ => "[INF]"
            };

            await hubContext.Clients.All.SendAsync("ReceiveMessage", "System", $"{levelPrefix} {request.Message}");

            return Results.Ok(new
            {
                log.Id,
                log.Timestamp,
                Level = log.Level.ToString(),
                log.Message
            });
        });
    }
}

// DTOs
public record CreateIncidentRequest(IncidentStatus Status);
public record ResolveIncidentRequest(string ResolvedBy);
public record AddLogRequest(IncidentLogLevel Level, string Message);
