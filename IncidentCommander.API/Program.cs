using IncidentCommander.API.Endpoints;
using IncidentCommander.API.Services;
using IncidentCommander.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

using IncidentCommander.API.Hubs;

[assembly: Microsoft.AspNetCore.Mvc.ApiController]

var builder = WebApplication.CreateBuilder(args);

// 1. Logging (Serilog)
builder.Host.UseSerilog((context, config) =>
{
    config.ReadFrom.Configuration(context.Configuration);
});

var logger = Log.ForContext<Program>(); // Create logger for startup

// 2. Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("IncidentCommander.API")));

// 3. Auth (JWT + Identity)
builder.Services.AddControllers(); // Enable Controllers

// Configure Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 10;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Configure JWT
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSection["Secret"] ?? "";
var key = System.Text.Encoding.UTF8.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSection["Issuer"] ?? "IncidentCommanderAPI",
        ValidateAudience = true,
        ValidAudience = jwtSection["Audience"] ?? "IncidentCommanderClient",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // For httpOnly cookie support 
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("accessToken"))
            {
                context.Token = context.Request.Cookies["accessToken"];
            }
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Register Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<IMcpAgentService, McpAgentService>();

// 4. (Chaos services removed - now using database-backed incidents)

// 5. SignalR
builder.Services.AddSignalR();

// 6. CORS
var corsOrigin = builder.Configuration["CorsOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy =>
    {
        policy.WithOrigins(corsOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. Services (OpenAPI)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); // .NET 10 built-in

var app = builder.Build();

// Auto-Apply Migrations & Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // 1. Migrate
        logger.Information("Attempting to apply database migrations...");
        await context.Database.MigrateAsync();
        logger.Information("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.Error(ex, "An error occurred while initializing the database.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // /openapi/v1.json
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();

// Identity Endpoints (Removed in favor of AuthController)
// app.MapIdentityApi<IdentityUser>();
app.MapControllers();

// Incident Endpoints (for MCP server)
app.MapIncidentEndpoints();

// Chaos Endpoints (for admin dashboard)
app.MapChaosEndpoints();

// SignalR Hubs
app.MapHub<IncidentHub>("/hubs/incident")
   .RequireCors("ClientApp");

app.MapHub<ChatHub>("/hubs/chat")
   .RequireCors("ClientApp");

// Log startup information using Serilog static logger
var urls = builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5000";
Log.Information("═══════════════════════════════════════════════");
Log.Information("✓ Incident Commander API is running!");
Log.Information("Listening on: {Urls}", urls);
Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information("═══════════════════════════════════════════════");

app.Run();


