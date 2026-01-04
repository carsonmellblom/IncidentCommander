using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.OpenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using ModelContextProtocol;
using ModelContextProtocol.Client;
using OpenAI.Chat;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using System.Runtime.CompilerServices;

namespace IncidentCommander.API.Services;

public interface IMcpAgentService
{
    Task<string> CreateThreadAsync();
    IAsyncEnumerable<string> ProcessMessageAsync(string threadId, string userMessage);
}

public class McpAgentService : IMcpAgentService
{
    private readonly ILogger<McpAgentService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _endpoint;
    private readonly string _deploymentName;
    private readonly string? _apiKey;
    private readonly AzureOpenAIClient _openAIClient;
    private readonly Dictionary<string, AIAgent> _threadAgents = new();
    private McpClient? _mcpClient;
    private IList<McpClientTool>? _mcpTools;

    public McpAgentService(IConfiguration configuration, ILogger<McpAgentService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _endpoint = configuration["Azure:OpenAI:Endpoint"] ?? "";
        _deploymentName = configuration["Azure:OpenAI:DeploymentName"] ?? "gpt-4o";
        _apiKey = configuration["Azure:OpenAI:ApiKey"];

        if (string.IsNullOrEmpty(_endpoint))
        {
            _logger.LogWarning("Azure OpenAI Endpoint is missing. Agent features will not work.");
        }

        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Azure OpenAI API Key is missing. Agent features will not work.");
        }

        // Use API Key authentication instead of DefaultAzureCredential for Docker compatibility
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _openAIClient = new AzureOpenAIClient(new System.Uri(_endpoint ?? "http://missing"), new Azure.AzureKeyCredential(_apiKey));
        }
        else
        {
            // Fallback to DefaultAzureCredential for local development with az login
            _openAIClient = new AzureOpenAIClient(new System.Uri(_endpoint ?? "http://missing"), new DefaultAzureCredential());
        }
    }

    public async Task<string> CreateThreadAsync()
    {
        return Guid.NewGuid().ToString();
    }

    public async IAsyncEnumerable<string> ProcessMessageAsync(string threadId, string userMessage)
    {
        // Ensure MCP client is initialized (do this outside yield context to avoid try-catch issues)
        if (_mcpClient == null || _mcpTools == null)
        {
            _logger.LogInformation("Initializing MCP client connection...");

            string? initError = null;
            try
            {
                await InitializeMcpClientAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to MCP server");
                initError = ex.Message;
            }

            if (initError != null)
            {
                yield return $"❌ Error: Failed to connect to MCP server: {initError}\n";
                yield break;
            }

            yield return "✅ Connected to MCP server!\n\n";
        }

        // Get or create agent for this thread
        if (!_threadAgents.TryGetValue(threadId, out var agent))
        {
            _logger.LogInformation("Creating new agent for thread {ThreadId}", threadId);

            // Convert ChatClient to IChatClient using AsIChatClient extension method
            IChatClient chatClient = _openAIClient.GetChatClient(_deploymentName).AsIChatClient();
            agent = chatClient.CreateAIAgent(
                instructions: "You are the Incident Commander AI. You help diagnose and remediate incidents using the provided tools. " +
                              "You have access to tools that can check system health, query incident logs, and perform remediation actions. " +
                              "Be concise, professional, and explain your actions step by step.",
                tools: _mcpTools!.Cast<AITool>().ToList()
            );

            _threadAgents[threadId] = agent;
        }

        var thread = agent.GetNewThread();

        _logger.LogInformation("Processing message for thread {ThreadId}: {Message}", threadId, userMessage);

        // Stream the agent's response
        await foreach (var update in agent.RunStreamingAsync(userMessage, thread))
        {
            // Stream text tokens as they arrive
            if (!string.IsNullOrEmpty(update.Text))
            {
                yield return update.Text;
            }
        }
    }

    private async Task InitializeMcpClientAsync()
    {
        var useStdio = _configuration.GetValue<bool>("McpServer:UseStdio", false);

        IClientTransport transport;

        if (useStdio)
        {
            // Local development with labenv - launch Python process
            var rootDir = FindProjectRoot();
            var mcpPath = Path.Combine(rootDir, "IncidentCommander.MCP");
            var serverScript = Path.Combine(mcpPath, "src", "incident_commander_mcp", "server.py");

            _logger.LogInformation("Connecting to MCP server via stdio at {Script}", serverScript);

            if (!File.Exists(serverScript))
            {
                throw new FileNotFoundException($"MCP server script not found at: {serverScript}");
            }

            // Create stdio transport for local Python process
            transport = new StdioClientTransport(new StdioClientTransportOptions
            {
                Name = "IncidentCommanderMCP",
                Command = "python",
                Arguments = [serverScript],
                WorkingDirectory = mcpPath
            });
        }
        else
        {
            // Docker/production - connect to HTTP/SSE MCP server
            var mcpBaseUrl = _configuration["McpServer:BaseUrl"] ?? "http://mcp:8000";

            _logger.LogInformation("Connecting to MCP server via HTTP/SSE at {Url}", mcpBaseUrl);

            // Create HTTP transport for containerized MCP server
            transport = new HttpClientTransport(new HttpClientTransportOptions
            {
                Endpoint = new Uri(mcpBaseUrl)
            });
        }

        // Create and initialize the MCP client
        _mcpClient = await McpClient.CreateAsync(transport);

        // Get available tools from the MCP server
        _mcpTools = await _mcpClient.ListToolsAsync();

        _logger.LogInformation("Discovered {Count} tools from MCP server: {Tools}",
            _mcpTools.Count,
            string.Join(", ", _mcpTools.Select(t => t.Name)));

        if (_mcpTools.Count == 0)
        {
            _logger.LogWarning("No tools discovered from MCP server!");
        }
    }

    private string FindProjectRoot()
    {
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        while (!Directory.Exists(Path.Combine(currentDir, ".git")) && Path.GetDirectoryName(currentDir) != null)
        {
            currentDir = Path.GetDirectoryName(currentDir)!;
        }
        return currentDir;
    }
}
