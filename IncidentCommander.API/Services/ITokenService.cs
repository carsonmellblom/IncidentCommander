using IncidentCommander.API.DTOs;
using IncidentCommander.Infrastructure.Data.Models;
using Microsoft.AspNetCore.Identity;

namespace IncidentCommander.API.Services;

public interface ITokenService
{
    Task<string> CreateTokenAsync(IdentityUser user);
    UserRefreshToken GenerateRefreshToken(string ipAddress);
}
