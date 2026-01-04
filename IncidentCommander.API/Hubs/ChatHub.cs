using IncidentCommander.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace IncidentCommander.API.Hubs;

[Authorize(Roles = "Admin")]
public class ChatHub : Hub
{
    private readonly IMcpAgentService _agentService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IMcpAgentService agentService, ILogger<ChatHub> logger)
    {
        _agentService = agentService;
        _logger = logger;
    }

    public async Task SendMessage(string threadId, string message)
    {
        var user = Context.User?.Identity?.Name ?? "Admin";

        _logger.LogInformation("Message received from {User} in thread {ThreadId}: {Message}", user, threadId, message);

        // Notify that the agent is thinking
        await Clients.Caller.SendAsync("AgentStatus", "Thinking...");

        try
        {
            await foreach (var token in _agentService.ProcessMessageAsync(threadId, message))
            {
                await Clients.Caller.SendAsync("ReceiveToken", token);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message in ChatHub");
            await Clients.Caller.SendAsync("ReceiveError", "Sorry, I encountered an error while processing your request.");
        }
        finally
        {
            await Clients.Caller.SendAsync("AgentStatus", "Idle");
            await Clients.Caller.SendAsync("MessageComplete");
        }
    }

    public async Task<string> CreateThread()
    {
        try
        {
            return await _agentService.CreateThreadAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating thread in ChatHub");
            throw new HubException("Failed to create agent conversation thread.");
        }
    }
}

