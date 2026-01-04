using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace IncidentCommander.Infrastructure.Data.Models;

public class UserRefreshToken
{
    [Key]
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Expires { get; set; }
    public bool IsExpired => DateTime.UtcNow >= Expires;
    public DateTime Created { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public DateTime? Revoked { get; set; }
    public string? RevokedByIp { get; set; }
    public string? ReplacedByToken { get; set; }
    public bool IsActive => Revoked == null && !IsExpired;

    public string UserId { get; set; } = string.Empty;
    public IdentityUser User { get; set; } = null!;
}
