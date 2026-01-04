using IncidentCommander.Infrastructure.Data;
using IncidentCommander.Infrastructure.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentCommander.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IncidentCommander.API.Endpoints;

public static class ChaosEndpoints
{
    public static void MapChaosEndpoints(this IEndpointRouteBuilder app)
    {
        //Only allow admins to access chaos endpoints
        var group = app.MapGroup("/api/chaos").RequireAuthorization(myPolicy => myPolicy.RequireRole("Admin"));

        //Toggle chaos
        group.MapPost("/toggle", async ([FromServices] AppDbContext db, [FromServices] IConfiguration config, [FromServices] IHubContext<IncidentHub> hubContext, [FromServices] ILogger<object> logger) =>
        {
            var isEnabled = config.GetValue<bool>("Chaos:Enabled");
            if (!isEnabled)
            {
                logger.LogWarning("Attempted to toggle chaos while feature is disabled.");
                return Results.Forbid();
            }

            // Check if there's an active incident
            var activeIncident = await db.Incidents
                .Where(i => i.ResolvedAt == null)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeIncident != null)
            {
                // Resolve existing incident
                activeIncident.ResolvedAt = DateTime.UtcNow;
                activeIncident.ResolvedBy = "Dashboard";

                var resolveLog = new IncidentLog
                {
                    IncidentId = activeIncident.Id,
                    Timestamp = DateTime.UtcNow,
                    Level = IncidentLogLevel.Info,
                    Message = "Manual override: Chaos stopped."
                };
                db.IncidentLogs.Add(resolveLog);
                await db.SaveChangesAsync();

                logger.LogInformation("Manual override: Chaos stopped.");
                await hubContext.Clients.All.SendAsync("ReceiveMessage", "System", "[INF] Manual override: Chaos stopped.");

                return Results.Ok(new { IsActive = false, Mode = "None" });
            }
            else
            {
                // Create new incident
                var incident = new Incident
                {
                    Status = IncidentStatus.DatabaseFailure,  // Default for demo
                    CreatedAt = DateTime.UtcNow
                };
                db.Incidents.Add(incident);
                await db.SaveChangesAsync();

                // Add initial log
                var startLog = new IncidentLog
                {
                    IncidentId = incident.Id,
                    Timestamp = DateTime.UtcNow,
                    Level = IncidentLogLevel.Error,
                    Message = "CRITICAL: Could not connect to primary database node at 10.0.0.5"
                };
                db.IncidentLogs.Add(startLog);
                await db.SaveChangesAsync();

                logger.LogInformation("Manual override: Chaos started (DatabaseFailure).");
                await hubContext.Clients.All.SendAsync("ReceiveMessage", "System", "[ERR] CRITICAL: Could not connect to primary database node at 10.0.0.5");

                return Results.Ok(new { IsActive = true, Mode = incident.Status.ToString() });
            }
        });

        //Get chaos status
        group.MapGet("/status", async ([FromServices] AppDbContext db) =>
        {
            var activeIncident = await db.Incidents
                .Where(i => i.ResolvedAt == null)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeIncident == null)
            {
                return Results.Ok(new { IsActive = false, Mode = "None" });
            }

            return Results.Ok(new { IsActive = true, Mode = activeIncident.Status.ToString() });
        });
    }
}
