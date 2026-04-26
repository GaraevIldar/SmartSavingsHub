FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/voice-service/NexTalk.Voice.Service/NexTalk.Voice.Service.csproj", "src/voice-service/NexTalk.Voice.Service/"]
RUN dotnet restore "src/voice-service/NexTalk.Voice.Service/NexTalk.Voice.Service.csproj"
COPY . .
WORKDIR "/src/src/voice-service/NexTalk.Voice.Service"
RUN dotnet build "./NexTalk.Voice.Service.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./NexTalk.Voice.Service.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NexTalk.Voice.Service.dll"]
