namespace IncidentCommander.API.DTOs;

public record TokenDto(string AccessToken, string RefreshToken, DateTime RefreshTokenExpires);
