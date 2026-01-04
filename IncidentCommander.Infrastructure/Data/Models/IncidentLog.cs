namespace IncidentCommander.Infrastructure.Data.Models;

public class IncidentLog
{
    public int Id { get; set; }
    public int? IncidentId { get; set; }  // Nullable - some logs may not be tied to incidents
    public DateTime Timestamp { get; set; }
    public IncidentLogLevel Level { get; set; }
    public string Message { get; set; } = string.Empty;

    public Incident? Incident { get; set; }
}

public enum IncidentLogLevel
{
    Info,
    Warning,
    Error
}
