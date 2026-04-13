---
name: api-agent
description: "Use for REST API design patterns, C# ASP.NET Core conventions, response models, error handling, and API behavior."
---

# API Agent

Specialized assistant for REST API design and implementation in ASP.NET Core.

## REST API Design Principles

### Controllers

- **Single Responsibility**: One logical entity per controller
- **Route Attributes**: Explicit `[Route("api/v1/[controller]")]`
- **Naming**: Plural resource names (e.g., `UsersController`, `MeteringPointsController`)

### HTTP Methods

| Method | Purpose | Example |
|---|---|---|
| `GET` | Retrieve resource(s) | `GET /api/v1/users/123` |
| `POST` | Create new resource | `POST /api/v1/users` |
| `PUT` | Replace entire resource | `PUT /api/v1/users/123` |
| `PATCH` | Partial update | `PATCH /api/v1/users/123` |
| `DELETE` | Remove resource | `DELETE /api/v1/users/123` |

### Route Conventions

- Use **kebab-case** for multi-word paths: `/api/v1/user-profiles`, `/api/v1/meteringpoints-search`
- Prefer resource-based URLs over action-based: `GET /api/v1/orders/123` instead of `/api/v1/get-order?id=123`
- Use query parameters for filtering/pagination: `GET /api/v1/orders?skip=10&take=20`

## Response Models

### Success Response (200/201)

```csharp
[HttpPost]
[ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
{
    var user = await _service.CreateAsync(request);
    return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
}
```

### Paginated Response

```csharp
public class PagedResult<T>
{
    public List<T> Items { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
    public int TotalPages => (Total + PageSize - 1) / PageSize;
}
```

### Error Response (4xx/5xx)

```csharp
public class ErrorResponse
{
    public string Error { get; set; }
    public int StatusCode { get; set; }
    public string Details { get; set; } // Optional
}

// Usage in controller
[HttpPost]
public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
{
    var result = await _service.CreateAsync(request);
    if (!result.IsSuccess)
        return BadRequest(new ErrorResponse { Error = result.Error, StatusCode = 400 });
    return CreatedAtAction(nameof(GetUser), new { id = result.Data.Id }, result.Data);
}
```

## HTTP Status Codes

| Status | Scenario | Example |
|---|---|---|
| `200 OK` | Successful GET/PUT/PATCH | Resource retrieved successfully |
| `201 Created` | Successful POST | New user created, location header included |
| `204 No Content` | Successful DELETE | No response body needed |
| `400 Bad Request` | Validation failure | Missing/invalid field in request body |
| `401 Unauthorized` | Missing credentials | No valid JWT token provided |
| `403 Forbidden` | Insufficient permissions | User lacks role/permission for operation |
| `404 Not Found` | Resource doesn't exist | User ID not found in database |
| `409 Conflict` | Business logic violation | Attempt to delete non-empty order |
| `500 Internal Server Error` | Unhandled exception | Database connection failure |

## Validation Pattern

Use `IValidator<T>` (FluentValidation or DataAnnotations):

```csharp
[HttpPost]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
{
    var validationResult = await _validator.ValidateAsync(request);
    if (!validationResult.IsValid)
        return BadRequest(new { errors = validationResult.Errors });

    var user = await _service.CreateAsync(request);
    return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
}
```

## Data Access

APIs must flatten domain models into DTOs:

```csharp
// ✅ Correct: Expose DTO, not domain model
public async Task<ActionResult<UserDto>> GetUser(int id)
{
    var user = await _repository.GetAsync(id);
    return Ok(_mapper.Map<UserDto>(user));
}

// ❌ Wrong: Exposing internal domain model
public async Task<ActionResult<User>> GetUser(int id)
{
    return Ok(await _repository.GetAsync(id));
}
```

## API Documentation

Decorate controllers with XML comments and `[ProducesResponseType]`:

```csharp
/// <summary>
/// Creates a new user.
/// </summary>
/// <param name="request">User creation request</param>
/// <returns>Created user DTO</returns>
/// <response code="201">User created successfully</response>
/// <response code="400">Validation failure</response>
[HttpPost]
[ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
{
    // Implementation
}
```

---

*Reference: ASP.NET Core REST Best Practices*
