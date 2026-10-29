#Requires -Version 7.0
<#
.SYNOPSIS
    ElWeb Phase 1 (cross-cutting search / search-by-id / auth) API checks against the BFF.
.DESCRIPTION
    Reads the BFF auth cookie from $env:ELWEB_COOKIE (never printed or written to disk).
    Expected values come from Utvikling DB baseline captured Oct 1, 2026 (FELLES.EFFYLKE, FELLES.EFJURPERSON).
.EXAMPLE
    $env:ELWEB_COOKIE = Get-Clipboard -Raw; ./ElWeb-Phase1-Api.ps1; Remove-Item Env:ELWEB_COOKIE
#>
param(
    [string]$Bff = 'https://hsnlnx-tstapp02.enoro.com:7187',
    [string]$OutFile = (Join-Path $PSScriptRoot "ElWeb-Phase1-Results-$(Get-Date -Format yyyyMMdd-HHmm).json")
)

$ErrorActionPreference = 'Stop'
$cookie = "$env:ELWEB_COOKIE".Trim()
if (-not $cookie) { throw 'ELWEB_COOKIE is empty. Copy the assembled cookie line to the clipboard, then re-run.' }
if ($cookie -notmatch '\.AspNetCore\.NexusEntraID_utviklingCookies=') { throw 'ELWEB_COOKIE does not look like the BFF cookie line (.AspNetCore.NexusEntraID_utviklingCookies=...; ...C1=...; ...).' }

$results = [System.Collections.Generic.List[object]]::new()

function Invoke-Bff {
    param([string]$Method, [string]$Path, $Body, [switch]$NoAuth)
    $headers = @{ Accept = 'application/json' }
    if (-not $NoAuth) { $headers.Cookie = $cookie }
    $req = @{
        Uri = "$Bff$Path"; Method = $Method; Headers = $headers
        SkipCertificateCheck = $true; MaximumRedirection = 0; SkipHttpErrorCheck = $true
    }
    if ($null -ne $Body) { $req.Body = ($Body | ConvertTo-Json -Depth 6 -Compress); $req.ContentType = 'application/json' }
    try {
        $r = Invoke-WebRequest @req
        $status = [int]$r.StatusCode; $content = $r.Content; $location = "$($r.Headers.Location)"
    }
    catch {
        $resp = $_.Exception.Response
        if (-not $resp) { throw }
        $status = [int]$resp.StatusCode; $content = ''; $location = "$($resp.Headers.Location)"
    }
    $json = $null
    if ($content) { try { $json = $content | ConvertFrom-Json } catch { } }
    [pscustomobject]@{ Status = $status; Json = $json; Raw = "$content"; Location = $location }
}

function Search-County([object[]]$Criteria, [int]$PageSize = 50) {
    Invoke-Bff POST '/api/v1/counties/search' @{ criteria = @($Criteria); page = 1; pageSize = $PageSize }
}

function Add-Result([string]$Id, [string]$Step, [string]$Expected, [string]$Actual, [bool]$Pass) {
    $results.Add([pscustomobject]@{ Id = $Id; Step = $Step; Expected = $Expected; Actual = $Actual; Result = $(if ($Pass) { 'PASS' } else { 'FAIL' }) })
}

function Test-Count([string]$Id, [string]$Step, [object[]]$Criteria, [int]$ExpectedTotal) {
    $r = Search-County $Criteria
    $total = $r.Json.totalCount
    Add-Result $Id $Step "200, totalCount=$ExpectedTotal" "$($r.Status), totalCount=$total, rows=$(@($r.Json.results).Count)" ($r.Status -eq 200 -and $total -eq $ExpectedTotal)
}

# Session sanity
$me = Invoke-Bff GET '/api/auth/me'
if ($me.Status -ne 200 -or -not $me.Json.isAuthenticated) { throw "Cookie not accepted: /api/auth/me returned $($me.Status). Refresh the cookie." }
Add-Result 'X-00' 'GET /api/auth/me with cookie' '200, isAuthenticated' "$($me.Status), $($me.Json.name)" $true

$ost = "$([char]0xD8)ST%"

# 1.1 Search operators (County)
Test-Count 'X-01' 'countyName = OSLO' @(@{ field = 'countyName'; value = 'OSLO'; operator = '=' }) 1
Test-Count 'X-02' 'countyName ~ AKERS' @(@{ field = 'countyName'; value = 'AKERS'; operator = '~' }) 2
Test-Count 'X-03' "countyName * $ost" @(@{ field = 'countyName'; value = $ost; operator = '*' }) 2
Test-Count 'X-04a' 'countyNo > 20' @(@{ field = 'countyNo'; value = '20'; operator = '>' }) 43
Test-Count 'X-04b' 'countyNo < 20' @(@{ field = 'countyNo'; value = '20'; operator = '<' }) 18
Test-Count 'X-04c' 'countyNo >= 20' @(@{ field = 'countyNo'; value = '20'; operator = '>=' }) 44
Test-Count 'X-04d' 'countyNo <= 20' @(@{ field = 'countyNo'; value = '20'; operator = '<=' }) 19
Test-Count 'X-05' 'countyNo >= 20 AND countyName ~ AKERS' @(
    @{ field = 'countyNo'; value = '20'; operator = '>=' },
    @{ field = 'countyName'; value = 'AKERS'; operator = '~' }) 1

$r = Search-County @(@{ field = 'countyName'; value = '  OSLO  '; operator = '=' })
Add-Result 'X-06' "Untrimmed value '  OSLO  ' via API (UI trims before sending)" 'informational' "$($r.Status), totalCount=$($r.Json.totalCount)" ($r.Status -in 200, 400)

$r = Search-County @()
$rows = @($r.Json.results).Count
Add-Result 'X-08' 'Empty criteria, pageSize 50' '200, rows=50, totalCount=62, hasMore=true' "$($r.Status), rows=$rows, totalCount=$($r.Json.totalCount), hasMore=$($r.Json.hasMore)" ($r.Status -eq 200 -and $rows -eq 50 -and $r.Json.totalCount -eq 62 -and $r.Json.hasMore)

Test-Count 'X-09' 'countyName = ZZZ_NO_MATCH' @(@{ field = 'countyName'; value = 'ZZZ_NO_MATCH'; operator = '=' }) 0

$r = Search-County @(@{ field = 'doesNotExist'; value = 'x'; operator = '=' })
$detail = if ($r.Json) { "$($r.Json.title) | $($r.Json.detail)" } else { $r.Raw.Substring(0, [Math]::Min(150, $r.Raw.Length)) }
Add-Result 'X-10' 'Unknown search field' '4xx ProblemDetails' "$($r.Status), $detail" ($r.Status -ge 400 -and $r.Status -lt 500)

# 1.2 Search by id
$r = Invoke-Bff GET '/api/v1/counties/3'
Add-Result 'X-11a' 'GET /api/v1/counties/3' '200, countyName=OSLO' "$($r.Status), $($r.Json.countyName)" ($r.Status -eq 200 -and $r.Json.countyName -eq 'OSLO')

$r = Invoke-Bff GET '/api/v1/customers/13383195'
Add-Result 'X-11b' 'GET /api/v1/customers/13383195' '200, lastName=Igelkjon' "$($r.Status), $($r.Json.lastName)" ($r.Status -eq 200 -and $r.Json.lastName -eq 'Igelkjon')

$r = Invoke-Bff GET '/api/v1/counties/999999'
Add-Result 'X-12a' 'GET /api/v1/counties/999999' '404' "$($r.Status)" ($r.Status -eq 404)

$r = Invoke-Bff GET '/api/v1/customers/999999999'
Add-Result 'X-12b' 'GET /api/v1/customers/999999999' '404' "$($r.Status)" ($r.Status -eq 404)

Test-Count 'X-13' 'countyNo > 3 via /search (non-= PK operator)' @(@{ field = 'countyNo'; value = '3'; operator = '>' }) 59

$r = Invoke-Bff GET '/api/v1/counties/abc'
Add-Result 'X-16' 'GET /api/v1/counties/abc (non-numeric PK)' '4xx, no 500' "$($r.Status)" ($r.Status -ge 400 -and $r.Status -lt 500)

# 1.4 Auth
$r = Invoke-Bff GET '/api/v1/counties/3' -NoAuth
Add-Result 'X-26a' 'GET county without cookie' '302 to login or 401, no data' "$($r.Status) $($r.Location)" ($r.Status -in 302, 401 -and -not $r.Json.countyName)

$r = Invoke-Bff POST '/api/v1/counties/search' @{ criteria = @(); page = 1; pageSize = 5 } -NoAuth
Add-Result 'X-26b' 'POST county search without cookie' '302 to login or 401, no data' "$($r.Status)" ($r.Status -in 302, 401 -and -not $r.Json.results)

$results | Format-Table -AutoSize -Wrap
$results | ConvertTo-Json -Depth 4 | Set-Content -Path $OutFile -Encoding utf8
$failed = @($results | Where-Object Result -eq 'FAIL').Count
Write-Host "`n$($results.Count) checks, $failed failed. Results: $OutFile"
