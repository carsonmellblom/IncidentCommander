using IncidentCommander.API.DTOs;
using IncidentCommander.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IncidentCommander.API.Controllers;

[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ITokenService _tokenService;

    public AuthController(UserManager<IdentityUser> userManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null) return Unauthorized("Invalid username or password");

        var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!result) return Unauthorized("Invalid username or password");

        var token = await _tokenService.CreateTokenAsync(user);

        // Set HttpOnly Cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps, // Only require HTTPS in production
            SameSite = SameSiteMode.Strict, // We can use Strict because of Proxy
            Expires = DateTime.UtcNow.AddMinutes(60)
        };

        Response.Cookies.Append("accessToken", token, cookieOptions);

        return Ok(new { message = "Login successful", email = user.Email });
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("accessToken");
        return Ok(new { message = "Logged out" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> Me()
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name!);
        if (user == null) return Unauthorized();

        return Ok(new { email = user.Email, roles = await _userManager.GetRolesAsync(user) });
    }
}
