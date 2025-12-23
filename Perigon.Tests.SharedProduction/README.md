# Perigon.Tests.SharedProduction

NUnit test suite for GRID-8280 - Shared Production button disabling when Elhub status is Disconnected.

## Setup

### Prerequisites
- .NET 8.0 SDK or later
- Chrome/Firefox/Edge browser installed
- Access to Perigon test environment

### Installation

1. Restore NuGet packages:
```powershell
dotnet restore
```

2. Build the project:
```powershell
dotnet build
```

### Configuration

Update the following in `BaseUITest.cs`:
- `TestEnvironmentUrl` - Your Perigon test environment URL
- `TestUsername` - Test user credentials
- `TestPassword` - Test user password

Update the following in `DisconnectedSharedProductionButtonTests.cs`:
- Element locators (IDs, XPaths, CSS selectors) to match your actual application

## Running Tests

### Run all tests:
```powershell
dotnet test
```

### Run specific test:
```powershell
dotnet test --filter "FullyQualifiedName~TC_8280_001"
```

### Run by category:
```powershell
dotnet test --filter "TestCategory=GRID-8280"
```

### Run with detailed output:
```powershell
dotnet test --logger "console;verbosity=detailed"
```

### Run with different browser:
```powershell
$env:TEST_BROWSER = "Firefox"
dotnet test
```

## Test Cases

- **TC-8280-001**: Verify Edit Shared Production Button is Disabled
- **TC-8280-002**: Verify Edit Members Button is Disabled
- **TC-8280-003**: Verify Activate Button is Disabled

## Test Data Requirements

Before running tests, ensure:
1. At least one shared production exists with Elhub status = 3 (Disconnected)
2. Test user has access to Metering Point module
3. Test user has permissions to view shared productions

## Screenshots

Failed test screenshots are saved to:
`<TestWorkDirectory>/Screenshots/`

## Troubleshooting

### WebDriver Issues
- Ensure Chrome/Firefox/Edge driver versions match your browser version
- Check that browsers are properly installed
- Verify driver executable permissions

### Element Not Found
- Update element locators in test code to match your application
- Verify test data exists in test environment
- Check page load timing (increase waits if needed)

### Login Issues
- Implement actual login logic in `BaseUITest.LoginToPerigon()`
- Verify credentials are correct
- Check test environment availability

## CI/CD Integration

Example for GitHub Actions:

```yaml
- name: Run Perigon Tests
  run: dotnet test --logger "trx;LogFileName=test-results.trx"
  working-directory: ./Perigon.Tests.SharedProduction
```

## Related Documentation

- [GRID-8280 Test Plan](../test-plans/GRID-8280_Test_Plan.md)
- [Jira Ticket GRID-8280](https://hansentechnologies.atlassian.net/browse/GRID-8280)
