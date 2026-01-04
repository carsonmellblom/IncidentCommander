using Microsoft.AspNetCore.Identity;

namespace IncidentCommander.API.Services;

public interface ITokenService
{
    Task<string> CreateTokenAsync(IdentityUser user);
}
