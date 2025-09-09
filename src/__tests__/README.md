# Polling App Tests

This directory contains comprehensive tests for the Polling App's server actions and core functionality.

## Test Structure

### Files Overview
- `setup.ts` - Jest configuration and mocks for Next.js, Supabase, and Prisma
- `actions.test.ts` - Main test suite covering all server actions
- `actions.integration.test.ts` - Integration tests and edge cases
- `run-tests.ts` - Custom test runner script with helpful features

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test actions.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

### Using the Custom Test Runner
```bash
# Basic run
tsx src/__tests__/run-tests.ts

# With options
tsx src/__tests__/run-tests.ts --watch --coverage --verbose

# Run specific tests
tsx src/__tests__/run-tests.ts --testNamePattern=signup

# Show help
tsx src/__tests__/run-tests.ts --help
```

## Test Coverage

### Authentication Actions
- ✅ `login()` - Valid credentials, validation errors, auth failures
- ✅ `signup()` - User creation, validation errors, database failures

### Poll Management Actions
- ✅ `createPoll()` - Poll creation, authentication checks, validation
- ✅ `updatePoll()` - Poll updates, authorization, error handling
- ✅ `deletePoll()` - Poll deletion, ownership validation, failures

### Voting Actions
- ✅ `submitVote()` - Vote submission, duplicate voting prevention, validation
- ✅ `hasUserVoted()` - Vote checking, authentication, error handling
- ✅ `getUserVote()` - User vote retrieval, null cases, failures

### Data Retrieval Actions
- ✅ `getPollWithVotes()` - Poll data with vote counts, error handling

## Test Categories

### 1. Unit Tests (`actions.test.ts`)
Tests individual functions with mocked dependencies:
- Input validation
- Success scenarios
- Error handling
- Authentication checks
- Database operation mocking

### 2. Integration Tests (`actions.integration.test.ts`)
Tests complete user flows and edge cases:
- User registration → Poll creation flow
- Complete voting workflow
- Data consistency checks
- Authorization edge cases
- Performance scenarios
- Network failure simulation

## Mock Strategy

### Mocked Dependencies
- **Next.js**: `redirect`, `revalidatePath` functions
- **Supabase**: Authentication client and methods
- **Prisma**: Database operations with configurable responses
- **Form Data**: Custom utility for creating test form data

### Mock Patterns
```typescript
// Successful authentication
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } }
    })
  }
};

// Database success
(prisma.poll.create as jest.Mock).mockResolvedValue(mockPollData);

// Database failure
(prisma.poll.create as jest.Mock).mockRejectedValue(new Error('Database error'));
```

## Test Scenarios

### Success Cases
- Valid user authentication
- Successful poll creation/update/deletion
- Vote submission and retrieval
- Data consistency and calculations

### Failure Cases
- Invalid input validation
- Authentication failures
- Database connection issues
- Authorization violations
- Duplicate operations
- Network timeouts

### Edge Cases
- Empty or malformed data
- Race conditions
- Large datasets
- Special characters in inputs
- Concurrent operations

## Debugging Tests

### Common Issues
1. **Mock not working**: Ensure mocks are properly cleared with `jest.clearAllMocks()`
2. **Async issues**: Always use `await` for async functions
3. **Type errors**: Check mock function signatures match actual implementations

### Debug Commands
```bash
# Run with verbose output
npm test -- --verbose

# Run single test file with debugging
npm test -- --testNamePattern="specific test" --verbose

# Generate coverage report
npm test -- --coverage --coverageDirectory=coverage
```

### Mock Debugging
```typescript
// Log mock calls
console.log((prisma.poll.create as jest.Mock).mock.calls);

// Check if mock was called
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
```

## Coverage Goals

Target coverage metrics:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD integration

## Test Data Patterns

### User Data
```typescript
const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
};
```

### Poll Data
```typescript
const mockPoll = {
  id: 'poll-123',
  question: 'Test question?',
  options: ['Option A', 'Option B'],
  creatorId: 'user-123',
  creator: { email: 'creator@test.com' },
  votes: []
};
```

### Form Data
```typescript
const formData = createFormData({
  email: 'user@example.com',
  password: 'password123'
});
```

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm install
    npm test -- --coverage --ci
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Best Practices

### Writing Tests
1. **Descriptive names**: Use clear, specific test descriptions
2. **Arrange-Act-Assert**: Structure tests with clear phases
3. **One assertion per test**: Focus on single behaviors
4. **Mock external dependencies**: Isolate units under test
5. **Test edge cases**: Include boundary conditions and error cases

### Maintaining Tests
1. **Keep tests updated**: Update when implementation changes
2. **Remove obsolete tests**: Clean up unused test code
3. **Refactor common patterns**: Use helper functions for repeated setup
4. **Document complex scenarios**: Add comments for intricate test logic

## Troubleshooting

### Common Errors

#### "Cannot find module" errors
```bash
# Ensure Jest can resolve path mappings
npm install --save-dev tsconfig-paths
```

#### Mock not being applied
```typescript
// Ensure mocks are defined before imports
jest.mock('@/lib/prisma', () => ({ ... }));
import { functionUnderTest } from '@/lib/actions';
```

#### Type errors in tests
```typescript
// Use proper Jest mock typing
const mockFunction = jest.fn() as jest.MockedFunction<typeof originalFunction>;
```

### Getting Help
1. Check Jest documentation: https://jestjs.io/docs
2. Review existing test patterns in the codebase
3. Run tests with `--verbose` flag for detailed output
4. Use `console.log` for debugging test execution

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Add both success and failure scenarios
3. Include edge cases and integration tests
4. Update this README if adding new test categories
5. Ensure tests are deterministic and can run in isolation

### Code Review Checklist
- [ ] Tests cover all code paths
- [ ] Failure scenarios are tested
- [ ] Mocks are properly configured
- [ ] Tests are readable and maintainable
- [ ] Coverage thresholds are maintained