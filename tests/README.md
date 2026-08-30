# Test Suite

Unit and integration tests for the SideQuest Tech platform API endpoints.

## Setup

Install test dependencies:

```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test admin-approve

# Run with coverage
npm test -- --coverage
```

## Test Structure

```
tests/
├── setup.js                    # Test environment setup (mocked env vars)
├── admin-approve.test.js       # Unit tests for admin-approve endpoint
└── multi-service-flow.test.js  # Integration test for multi-service requests
```

## Test Coverage

### `admin-approve.test.js`

Tests the approval logic for project requests with comprehensive scenarios:

#### New Client Approval
- ✅ Creates new client account for first-time customer
- ✅ Creates ClickUp folder for new company
- ✅ Sends welcome email with temporary password
- ✅ Sets `mustChangePassword` flag

#### Existing Client - Additional Project
- ✅ Adds new project to existing client without duplicating account
- ✅ Reuses existing ClickUp folder
- ✅ Sends "project added" email (not welcome email)
- ✅ Does not generate new password
- ✅ Updates `client_projects` array correctly

#### Error Handling
- ✅ Returns 401 for missing/invalid admin secret
- ✅ Returns 400 for missing required fields
- ✅ Handles ClickUp API failures gracefully

### `multi-service-flow.test.js`

End-to-end integration test simulating realistic customer journeys:

- ✅ Customer requests Service A → approved → account created
- ✅ Same customer requests Service B → approved → project added
- ✅ Verifies folder reuse across multiple projects
- ✅ Verifies project list accumulation
- ✅ Tests third service request for same customer

## Key Scenarios Tested

### Scenario 1: First-Time Customer
```
Customer "Sarah" requests Website Development
→ Admin approves
→ Creates client account with temp password
→ Creates ClickUp folder "Acme Corp"
→ Creates ClickUp list "Website Development"
→ Sends welcome email with credentials
```

### Scenario 2: Returning Customer (Same Email)
```
Customer "Sarah" (existing) requests Mobile App
→ Admin approves
→ Reuses existing account & password
→ Reuses existing ClickUp folder "Acme Corp"
→ Creates new ClickUp list "Mobile App Development"
→ Adds list to client_projects array
→ Sends "project added" email (no credentials)
```

### Scenario 3: Multiple Projects
```
Customer requests 3 different services
→ 1 folder created
→ 3 lists created
→ All 3 lists in client_projects array
→ Client sees all 3 projects in project switcher
```

## Mocking Strategy

Tests use Vitest mocking to isolate the logic:

- **Redis**: In-memory Map simulating Redis operations
- **Resend**: Mock email client (verifies email content)
- **ClickUp API**: Mock fetch responses
- **bcryptjs**: Deterministic password hashing

No external services are called during tests.

## Debugging Tests

Enable verbose output:

```bash
npm test -- --reporter=verbose
```

See what's being tested:

```bash
npm test -- --reporter=tap
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
```

## Next Steps

Consider adding:
- Tests for `/api/login.js` (admin + client login)
- Tests for `/api/client-projects.js` (JWT validation)
- Tests for `/api/clickup-proxy.js` (scoping logic)
- E2E tests with Playwright for the full UI flow
