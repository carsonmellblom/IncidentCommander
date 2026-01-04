using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using IncidentCommander.Infrastructure.Data.Models;

namespace IncidentCommander.Infrastructure.Data;

public class AppDbContext : IdentityDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Incident> Incidents { get; set; } = null!;
    public DbSet<IncidentLog> IncidentLogs { get; set; } = null!;
}
