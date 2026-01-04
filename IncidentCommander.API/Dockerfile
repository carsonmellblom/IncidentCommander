# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Copy csproj files and restore dependencies
COPY ["IncidentCommander.API/IncidentCommander.API.csproj", "IncidentCommander.API/"]
COPY ["IncidentCommander.Infrastructure/IncidentCommander.Infrastructure.csproj", "IncidentCommander.Infrastructure/"]
RUN dotnet restore "IncidentCommander.API/IncidentCommander.API.csproj"

# Copy the rest of the code and build
COPY . .
WORKDIR /source/IncidentCommander.API
RUN dotnet publish -c Release -o /app

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5294
ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 5294

ENTRYPOINT ["dotnet", "IncidentCommander.API.dll"]
