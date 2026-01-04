import os
import asyncio
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

async def main():
    # Load environment variables from .env if present
    load_dotenv()

    connection_string = os.getenv("AZURE_AI_FOUNDRY_CONNECTION_STRING")
    model_deployment_name = os.getenv("AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT_NAME")
    agent_name = os.getenv("AZURE_AI_FOUNDRY_AGENT_NAME", "IncidentCommanderAgent")

    if not connection_string:
        print("Error: AZURE_AI_FOUNDRY_CONNECTION_STRING environment variable is not set.")
        return

    if not model_deployment_name:
        print("Error: AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT_NAME environment variable is not set.")
        return

    print(f"Connecting to Azure AI Project...")
    
    # Authenticate and create the client
    # DefaultAzureCredential will work with Azure CLI login, Managed Identity, etc.
    credential = DefaultAzureCredential()
    project_client = AIProjectClient.from_connection_string(
        credential=credential,
        conn_str=connection_string,
    )

    async with project_client:
        print(f"Provisioning Agent: {agent_name}...")
        
        # Create the agent
        agent = await project_client.agents.create_agent(
            model=model_deployment_name,
            name=agent_name,
            instructions=(
                "You are the Incident Commander Agent. Your goal is to help diagnose and "
                "remediate system incidents. You have access to a Model Context Protocol (MCP) server "
                "that provides tools for system monitoring, chaos engineering, and remediation. "
                "Always be concise, professional, and explain your reasoning when taking actions."
            )
        )
        
        print(f"Successfully created agent!")
        print(f"Agent ID: {agent.id}")
        print(f"Agent Name: {agent.name}")
        print("-" * 20)
        print("Please add these values to your .NET appsettings.json or backend .env:")
        print(f"Azure__AiFoundry__AgentId={agent.id}")

if __name__ == "__main__":
    asyncio.run(main())
