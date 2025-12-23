# ReportGenerator Implementation Guide

## Overview
This guide explains how to add code coverage reporting using **ReportGenerator** to a new .NET project, based on the Perigon implementation.

---

## What is Cyclomatic Complexity?

**Cyclomatic complexity** is a software metric that measures the complexity of code by counting the number of **linearly independent paths** through a program's source code. It was developed by Thomas McCabe in 1976.

### How It's Calculated
Cyclomatic complexity counts decision points in your code:
- **`if`** statements
- **`else`** branches
- **`while`** and **`for`** loops
- **`case`** statements in `switch`
- **`&&`** and **`||`** logical operators
- **`catch`** exception handlers
- **Ternary operators** (`? :`)

**Formula**: `M = E - N + 2P`
- `E` = edges in the control flow graph
- `N` = nodes in the control flow graph
- `P` = number of connected components (usually 1)

### Interpretation
| Complexity | Risk Level | Maintainability |
|------------|------------|-----------------|
| 1-10 | ✅ Low | Simple, easy to test |
| 11-20 | ⚠️ Moderate | More complex, still manageable |
| 21-50 | ⚠️ High | Difficult to test and maintain |
| 50+ | 🔴 Very High | Refactor recommended |

### Example

```csharp
// Cyclomatic Complexity = 1 (no branches)
public int Add(int a, int b) 
{
    return a + b;
}

// Cyclomatic Complexity = 3 (2 if statements + 1 base path)
public string GetGrade(int score) 
{
    if (score >= 90)        // Decision point 1
        return "A";
    if (score >= 80)        // Decision point 2
        return "B";
    return "C";
}

// Cyclomatic Complexity = 5 (4 decision points + 1 base path)
public bool IsValid(User user)
{
    if (user == null)                    // Decision point 1
        return false;
    if (string.IsNullOrEmpty(user.Name)) // Decision point 2
        return false;
    if (user.Age < 0 || user.Age > 120)  // Decision points 3 & 4 (|| operator)
        return false;
    return true;
}
```

### Why It Matters for Testing
- **Higher complexity = More test cases needed** to achieve full coverage
- **Methods with complexity > 10** should be prioritized for unit testing
- **Methods with complexity > 20** are candidates for refactoring
- ReportGenerator highlights high-complexity methods in coverage reports

### In ReportGenerator Reports
ReportGenerator calculates cyclomatic complexity for each method and:
- Displays complexity scores in HTML reports (color-coded by risk)
- Identifies methods that need additional testing
- Helps teams prioritize refactoring efforts
- Tracks complexity trends over time

**Benefits**:
- 📊 Quantifies code complexity objectively
- 🎯 Guides test coverage efforts
- 🔍 Identifies refactoring candidates
- 📈 Monitors code quality trends

---

## Current Perigon Implementation

### 1. **Package Dependencies** (Centralized Management)

**Location**: `Directory.Packages.props` (solution root)

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="coverlet.collector" Version="6.0.4" />
  </ItemGroup>
</Project>
```

### 2. **Test Project Configuration**

**Location**: Each test project (e.g., `Perigon.Modules.MeteringPoint.UnitTests.csproj`)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="NUnit" />
    <PackageReference Include="NUnit3TestAdapter" />
    <PackageReference Include="coverlet.collector" />  <!-- No version - managed centrally -->
  </ItemGroup>
</Project>
```

### 3. **Coverlet Configuration**

**Location**: `coverlet.runsettings` (solution root)

```xml
<?xml version="1.0" encoding="utf-8" ?>
<RunSettings>
  <DataCollectionRunSettings>
    <DataCollectors>
      <DataCollector friendlyName="XPlat code coverage">
        <Configuration>
          <Format>cobertura</Format>
          <IncludeTestAssembly>false</IncludeTestAssembly>
          <ExcludeByFile>**/bin/**/*,**/obj/**/*</ExcludeByFile>
          <SingleHit>false</SingleHit>
          <UseSourceLink>true</UseSourceLink>
        </Configuration>
      </DataCollector>
    </DataCollectors>
  </DataCollectionRunSettings>
</RunSettings>
```

### 4. **GitHub Actions Workflow**

**Location**: `.github/workflows/build.yml`

```yaml
# Step 1: Run tests with coverage collection
- name: Test + Collect Coverage (Cobertura + LCOV)
  run: |
    mkdir TestResults
    dotnet test --configuration Release --no-build `
      --collect:"XPlat Code Coverage" `
      --results-directory TestResults `
      -- `
      DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura,lcov

# Step 2: Install ReportGenerator tool
- name: Install ReportGenerator
  run: dotnet tool install --global dotnet-reportgenerator-globaltool

# Step 3: Generate HTML + Markdown + Text reports
- name: Generate HTML + Markdown + Text summaries
  if: always()
  run: |
    $env:Path += ";$env:USERPROFILE\.dotnet\tools"
    reportgenerator `
      -reports:"**\coverage.cobertura.xml" `
      -targetdir:"coveragereport" `
      -reporttypes:"Html;MarkdownSummary;TextSummary" `
      -assemblyfilters:"+*"

# Step 4: Show summary in workflow logs
- name: Show coverage summary in logs
  if: always()
  run: |
    Write-Host "==== Coverage summary (TextSummary) ===="
    Get-Content .\coveragereport\Summary.txt | Write-Host

# Step 5: Upload reports as artifacts
- name: Upload coverage artifacts
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: |
      coveragereport/**
      **/coverage.cobertura.xml
      **/coverage.info
    if-no-files-found: warn
```

---

## How to Add to a New Project

### Prerequisites
- .NET 8.0+ SDK installed
- NUnit test framework
- GitHub repository with Actions enabled

---

### Step 1: Set Up Central Package Management (5 minutes)

**Create `Directory.Packages.props` in solution root:**

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  
  <ItemGroup>
    <!-- Testing Packages -->
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageVersion Include="NUnit" Version="3.14.0" />
    <PackageVersion Include="NUnit3TestAdapter" Version="4.5.0" />
    <PackageVersion Include="coverlet.collector" Version="6.0.4" />
    
    <!-- Mocking (if needed) -->
    <PackageVersion Include="NSubstitute" Version="5.1.0" />
  </ItemGroup>
</Project>
```

**Benefits:**
- ✅ Single source of truth for package versions
- ✅ Easy to update all projects at once
- ✅ Prevents version conflicts

---

### Step 2: Configure Test Project (3 minutes)

**Modify `YourProject.Tests.csproj`:**

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <!-- No version numbers - managed centrally -->
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="NUnit" />
    <PackageReference Include="NUnit3TestAdapter" />
    <PackageReference Include="coverlet.collector" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\YourProject\YourProject.csproj" />
  </ItemGroup>
</Project>
```

---

### Step 3: Create Coverlet Configuration (2 minutes)

**Create `coverlet.runsettings` in solution root:**

```xml
<?xml version="1.0" encoding="utf-8" ?>
<RunSettings>
  <DataCollectionRunSettings>
    <DataCollectors>
      <DataCollector friendlyName="XPlat code coverage">
        <Configuration>
          <!-- Output format: cobertura XML for ReportGenerator -->
          <Format>cobertura</Format>
          
          <!-- Don't include test assemblies in coverage -->
          <IncludeTestAssembly>false</IncludeTestAssembly>
          
          <!-- Exclude build artifacts -->
          <ExcludeByFile>**/bin/**/*,**/obj/**/*,**/wwwroot/**/*</ExcludeByFile>
          
          <!-- Track each line hit separately (not just "hit/not hit") -->
          <SingleHit>false</SingleHit>
          
          <!-- Use SourceLink for accurate source mapping -->
          <UseSourceLink>true</UseSourceLink>
        </Configuration>
      </DataCollector>
    </DataCollectors>
  </DataCollectionRunSettings>
</RunSettings>
```

---

### Step 4: Test Locally (5 minutes)

**Run tests with coverage:**

```powershell
# Clean previous results
Remove-Item TestResults -Recurse -Force -ErrorAction SilentlyContinue

# Run tests and collect coverage
dotnet test --collect:"XPlat Code Coverage" --results-directory TestResults

# Install ReportGenerator (one-time)
dotnet tool install --global dotnet-reportgenerator-globaltool

# Generate HTML report
reportgenerator `
  -reports:"TestResults\**\coverage.cobertura.xml" `
  -targetdir:"coveragereport" `
  -reporttypes:"Html;TextSummary"

# Open report in browser
Start-Process "coveragereport\index.html"
```

**Verify:**
- ✅ HTML report opens in browser
- ✅ Shows coverage percentage
- ✅ Can drill down into classes/methods

---

### Step 5: Set Up GitHub Actions (10 minutes)

**Create `.github/workflows/test-coverage.yml`:**

```yaml
name: Test & Coverage
on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: windows-latest  # or ubuntu-latest for Linux
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore Dependencies
        run: dotnet restore
      
      - name: Build
        run: dotnet build --configuration Release --no-restore
      
      # --- COVERAGE STARTS HERE ---
      
      - name: Run Tests with Coverage
        run: |
          dotnet test --configuration Release --no-build `
            --collect:"XPlat Code Coverage" `
            --results-directory TestResults `
            --logger "console;verbosity=detailed" `
            -- `
            DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura,lcov
      
      - name: Install ReportGenerator
        run: dotnet tool install --global dotnet-reportgenerator-globaltool
      
      - name: Generate Coverage Report
        if: always()
        run: |
          reportgenerator `
            -reports:"TestResults\**\coverage.cobertura.xml" `
            -targetdir:"coveragereport" `
            -reporttypes:"Html;MarkdownSummary;TextSummary" `
            -assemblyfilters:"+*"
      
      - name: Display Coverage Summary
        if: always()
        run: |
          Write-Host "`n=== COVERAGE SUMMARY ===`n"
          Get-Content coveragereport\Summary.txt
      
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-${{ github.run_number }}
          path: coveragereport/
          retention-days: 30
      
      - name: Upload Coverage XML
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-xml-${{ github.run_number }}
          path: TestResults/**/coverage.cobertura.xml
          retention-days: 30
```

---

### Step 6: Add Coverage Threshold Enforcement (Optional, 5 minutes)

**Add this step to fail PRs below coverage threshold:**

```yaml
- name: Enforce Minimum Coverage
  if: github.event_name == 'pull_request'
  shell: pwsh
  run: |
    $summary = Get-Content "coveragereport\Summary.txt" -Raw
    
    if ($summary -match 'Line coverage:\s+([0-9]+\.[0-9]+)') {
      $coverage = [double]$Matches[1]
      $threshold = 80.0  # Set your minimum coverage %
      
      Write-Host "Line Coverage: $coverage% (Threshold: $threshold%)"
      
      if ($coverage -lt $threshold) {
        Write-Error "❌ Coverage $coverage% is below threshold $threshold%"
        exit 1
      } else {
        Write-Host "✅ Coverage meets threshold"
      }
    } else {
      Write-Warning "Could not parse coverage from report"
    }
```

---

## Advanced Configuration

### Filter Assemblies

**Exclude test projects and third-party libraries:**

```yaml
reportgenerator `
  -reports:"TestResults\**\coverage.cobertura.xml" `
  -targetdir:"coveragereport" `
  -reporttypes:"Html;TextSummary" `
  -assemblyfilters:"-*.Tests;-*.UnitTests;-xunit*;-nunit*"
```

### Filter Files

**Exclude auto-generated files:**

```yaml
reportgenerator `
  -reports:"TestResults\**\coverage.cobertura.xml" `
  -targetdir:"coveragereport" `
  -reporttypes:"Html" `
  -filefilters:"-*.Designer.cs;-*.g.cs;-*AssemblyInfo.cs"
```

### Multiple Report Formats

**Generate different formats for different uses:**

```yaml
reportgenerator `
  -reports:"TestResults\**\coverage.cobertura.xml" `
  -targetdir:"coveragereport" `
  -reporttypes:"Html;Badges;Cobertura;JsonSummary;TextSummary;MarkdownSummary"
```

**Available formats:**
- `Html` - Full interactive HTML report (recommended for developers)
- `Html_Light` - Lighter HTML version (faster to generate/load)
- `Badges` - SVG badges for README
- `TextSummary` - Console-friendly text
- `MarkdownSummary` - For GitHub issues/PRs
- `Cobertura` - XML format for other tools
- `lcov` - For SonarQube integration

---

## Troubleshooting

### Issue: "No coverage files found"

```powershell
# Verify coverage files exist
Get-ChildItem -Recurse -Filter "coverage.cobertura.xml"

# Check test execution
dotnet test --collect:"XPlat Code Coverage" --verbosity detailed
```

### Issue: "ReportGenerator command not found"

```powershell
# Install globally
dotnet tool install --global dotnet-reportgenerator-globaltool

# Or install locally to project
dotnet new tool-manifest
dotnet tool install dotnet-reportgenerator-globaltool
dotnet tool run reportgenerator --help
```

### Issue: "Coverage is 0%"

**Check:**
1. ✅ Test project references the code project
2. ✅ Tests are actually running (check test count)
3. ✅ `coverlet.collector` package is installed
4. ✅ `IsTestProject` is set to `true`

---

## Quick Start Checklist

For a new project, follow this checklist:

- [ ] **Step 1**: Create `Directory.Packages.props` with coverlet.collector
- [ ] **Step 2**: Add `coverlet.collector` to test project (no version)
- [ ] **Step 3**: Create `coverlet.runsettings` in solution root
- [ ] **Step 4**: Test locally: `dotnet test --collect:"XPlat Code Coverage"`
- [ ] **Step 5**: Install ReportGenerator: `dotnet tool install -g dotnet-reportgenerator-globaltool`
- [ ] **Step 6**: Generate report: `reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coveragereport -reporttypes:Html`
- [ ] **Step 7**: Open `coveragereport/index.html` - verify it works
- [ ] **Step 8**: Create `.github/workflows/test-coverage.yml`
- [ ] **Step 9**: Push to GitHub - verify Actions run
- [ ] **Step 10**: Download artifact from Actions - verify HTML report

**Total Time**: ~30 minutes for complete setup

---

## Cost & Maintenance

**Free Tier Limits:**
- GitHub Actions: 2,000 minutes/month (free for public repos)
- Artifact Storage: 500 MB (default retention: 90 days)
- ReportGenerator: Open source, free forever

**Maintenance:**
- Update package versions quarterly
- Review excluded files/assemblies as project grows
- Adjust coverage thresholds based on team goals

---

## Resources

- **ReportGenerator**: https://reportgenerator.io/
- **Coverlet**: https://github.com/coverlet-coverage/coverlet
- **GitHub Actions**: https://docs.github.com/en/actions
- **Perigon Example**: `.github/workflows/build.yml` (lines 186-275)

---

## Summary

**Perigon Implementation:**
1. ✅ Centralized package management (`Directory.Packages.props`)
2. ✅ Coverlet collector in all test projects
3. ✅ Configuration file (`coverlet.runsettings`)
4. ✅ GitHub Actions with ReportGenerator
5. ✅ Artifact upload for team access
6. ✅ Coverage threshold enforcement (4.1%)

**Benefits:**
- 📊 Visual HTML reports with drill-down
- 🎯 Coverage tracking over time
- 🚨 PR validation with thresholds
- 📦 Easy artifact sharing
- 💰 Zero cost for implementation
