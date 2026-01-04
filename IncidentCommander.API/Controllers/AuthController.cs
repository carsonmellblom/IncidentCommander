using IncidentCommander.API.DTOs;
using IncidentCommander.API.Services;
using IncidentCommander.Infrastructure.Data;
using IncidentCommander.Infrastructure.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IncidentCommander.API.Controllers;

[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _context;

    public AuthController(UserManager<IdentityUser> userManager, ITokenService tokenService, AppDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null) return Unauthorized("Invalid username or password");

        var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!result) return Unauthorized("Invalid username or password");

        var accessToken = await _tokenService.CreateTokenAsync(user);
        var refreshToken = _tokenService.GenerateRefreshToken(GetIpAddress());
        refreshToken.UserId = user.Id;

        _context.UserRefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        SetTokensInCookies(accessToken, refreshToken.Token, refreshToken.Expires);

        return Ok(new { message = "Login successful", email = user.Email });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var token = await _context.UserRefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);
            if (token != null && token.IsActive)
            {
                token.Revoked = DateTime.UtcNow;
                token.RevokedByIp = GetIpAddress();
                await _context.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Logged out" });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized("No refresh token");

        var token = await _context.UserRefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        if (token == null || !token.IsActive)
        {
            // Security measure: if token is inactive (revoked or expired), potentially handle reuse detection
            if (token != null && token.Revoked != null)
            {
                // Token reuse detected! Revoke all tokens for this user for safety
                var allTokens = await _context.UserRefreshTokens.Where(x => x.UserId == token.UserId && x.IsActive).ToListAsync();
                foreach (var t in allTokens) t.Revoked = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return Unauthorized("Invalid refresh token");
        }

        // Generate new tokens (Rotation)
        var newAccessToken = await _tokenService.CreateTokenAsync(token.User);
        var newRefreshToken = _tokenService.GenerateRefreshToken(GetIpAddress());
        newRefreshToken.UserId = token.UserId;

        // Revoke the old token
        token.Revoked = DateTime.UtcNow;
        token.RevokedByIp = GetIpAddress();
        token.ReplacedByToken = newRefreshToken.Token;

        _context.UserRefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        SetTokensInCookies(newAccessToken, newRefreshToken.Token, newRefreshToken.Expires);

        return Ok(new { message = "Token refreshed" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> Me()
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name!);
        if (user == null) return Unauthorized();

        return Ok(new { email = user.Email, roles = await _userManager.GetRolesAsync(user) });
    }

    private void SetTokensInCookies(string accessToken, string refreshToken, DateTime refreshTokenExpires)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Force HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(5) // Access token expiry
        };
        Response.Cookies.Append("accessToken", accessToken, cookieOptions);

        var refreshCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Force HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = refreshTokenExpires
        };
        Response.Cookies.Append("refreshToken", refreshToken, refreshCookieOptions);
    }

    private string GetIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            return forwardedFor!;
        else
            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "N/A";
    }
}
