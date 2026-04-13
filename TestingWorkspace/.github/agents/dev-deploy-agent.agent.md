---
name: dev-deploy-agent
description: "Use for local build/run workflows, test execution with coverage, Vite dev server, configuration, and deployment guidance."
---

# Dev/Deploy Agent

Specialized assistant for local development, testing, build automation, and deployment workflows.

## Local Build & Restore

### Prerequisites
- .NET 10.0 SDK installed
- Node.js (for frontend build)
- PowerShell 7+ (for scripting)

### Build Commands

```powershell
# Restore all NuGet packages
dotnet restore

# Build entire solution
dotnet build

# Build specific configuration (Release = optimized)
dotnet build -c Release

# Rebuild (clean + build)
dotnet rebuild

# Build specific project only
dotnet build src/Perigon/Perigon.csproj
```

## Unit Testing with Coverage

### Run All Tests

```powershell
dotnet test
```

### Generate Coverage Report

```powershell
# Using coverlet.runsettings
dotnet test --settings coverlet.runsettings

# Output formats: opencover, cobertura, lcov, json
```

### Test Specific Project

```powershell
dotnet test tests/Perigon.Modules.MeteringPoint.UnitTests/
```

### Test with Verbosity

```powershell
dotnet test -v detailed          # Verbose output
dotnet test --logger "console;verbosity=detailed"
```

## Frontend Development

### Install Dependencies

```bash
cd src
npm install
```

### Development Server (Hot Reload)

```bash
npm run dev
```

Access at `http://localhost:5173` (or displayed URL).

### Production Build

```bash
npm run build
```

Output to `dist/` directory.

### Vite Configuration

Location: `src/vite.config.ts` (if present)

Update for proxy, plugins, build optimization.

## Configuration Management

### Environment-Specific Settings

| File | Purpose |
|---|---|
| `appsettings.json` | Base configuration |
| `appsettings.Development.json` | Development overrides |
| `appsettings.Production.json` | Production settings |

### Central Package Management

`Directory.Packages.props` — single source of truth for NuGet versions. All projects reference via `<PackageReference Include="..." Version="$(SomePackageVersion)" />`.

Update this file when managing NuGet versions across the solution.

### Authentication Configuration

- **Provider**: OpenID Connect (Hansen IdentityServer or Microsoft Entra ID)
- **Settings**: `appsettings.*.json` under `Authentication` section
- **Secrets**: Use `dotnet user-secrets` for local credential storage

```powershell
dotnet user-secrets init
dotnet user-secrets set "Authentication:ClientSecret" "your-secret"
```

## Database Configuration

### Oracle Connection

Example `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "OracleConnection": "User Id=dev_user;Password=secret;Data Source=(DESCRIPTION=...)"
  }
}
```

### Testing with Test Data

Use mock `IOracleDatabaseConnection` in unit tests (see test-planner agent).

## Deployment

### Build for Release

```powershell
dotnet publish -c Release -o ./publish
```

### Publish Output

Located in `./publish/`:
- `Perigon.dll` — Main application assembly
- `Perigon.deps.json` — Runtime dependencies
- `Perigon.runtimeconfig.json` — Runtime configuration
- `appsettings.*.json` — Configuration files
- `wwwroot/` — Static files (CSS, JS, images)

### Deployment Prerequisites

1. **.NET 10.0 Runtime** installed on target server
2. **Oracle Client** configured (for database connectivity)
3. **IIS** configured (if deploying to IIS)
4. **Configuration files** updated for production environment
5. **SSL/TLS certificate** installed (for HTTPS)

### IIS Deployment

1. Create Application Pool (no managed code for .NET Core)
2. Create new website pointing to published folder
3. Configure application binding (port, hostname)
4. Verify `web.config` includes ASP.NET Core handler
5. Set folder permissions for IIS app pool identity

### Health Check Post-Deployment

```powershell
# Test connectivity
Invoke-WebRequest -Uri "https://your-server/health" -UseBasicParsing

# Check application logs
Get-Content "logs/perigon-*.log" -Tail 50
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '10.0'
      - run: dotnet restore
      - run: dotnet build
      - run: dotnet test --settings coverlet.runsettings
```

## Troubleshooting

| Issue | Solution |
|---|---|
| Build fails: "SDK not found" | Install .NET 10.0 SDK from microsoft.com |
| Test timeout | Increase timeout: `dotnet test --logger "console;verbosity=detailed" --blame-hang-timeout 30000` |
| Coverage report empty | Verify `[ExcludeFromCodeCoverage]` attributes not applied to target classes |
| Oracle connection fails | Check connection string, confirm Oracle client installed |
| npm: command not found | Install Node.js from nodejs.org |

---

*Reference: .NET 10.0 Documentation, Vite Documentation, GitHub Actions*
