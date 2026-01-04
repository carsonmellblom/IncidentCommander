namespace IncidentCommander.Infrastructure.Data.Models;

public class Incident
{
    public int Id { get; set; }
    public IncidentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }  // "Dashboard" or "AI Agent"

    public ICollection<IncidentLog> Logs { get; set; } = new List<IncidentLog>();
}

public enum IncidentStatus
{
    Healthy,
    DatabaseFailure,
    DatabaseLatency
}
