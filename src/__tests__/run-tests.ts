#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TestConfig {
  testMatch: string[];
  collectCoverage: boolean;
  verbose: boolean;
}

class TestRunner {
  private config: TestConfig;

  constructor() {
    this.config = {
      testMatch: ['**/__tests__/**/*.test.ts'],
      collectCoverage: true,
      verbose: true,
    };
  }

  private log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  private checkDependencies(): boolean {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      const requiredDeps = ['jest', 'ts-jest', '@types/jest'];
      const missingDeps = requiredDeps.filter(dep =>
        !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
      );

      if (missingDeps.length > 0) {
        this.log(`Missing test dependencies: ${missingDeps.join(', ')}`, 'error');
        this.log('Please install them with: npm install --save-dev ' + missingDeps.join(' '), 'info');
        return false;
      }

      return true;
    } catch (error) {
      this.log('Error checking dependencies: ' + (error as Error).message, 'error');
      return false;
    }
  }

  private runTests(options: string[] = []): void {
    const jestCommand = [
      'npx jest',
      '--passWithNoTests',
      '--testMatch="**/__tests__/**/*.test.ts"',
      '--testMatch="**/?(*.)+(spec|test).ts"',
      ...options
    ].join(' ');

    try {
      this.log('🚀 Running tests...', 'info');
      this.log(`Command: ${jestCommand}`, 'info');

      execSync(jestCommand, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      this.log('✅ Tests completed successfully!', 'success');
    } catch (error) {
      this.log('❌ Tests failed!', 'error');
      process.exit(1);
    }
  }

  public async run(): Promise<void> {
    this.log('🔍 Polling App Test Runner', 'info');
    this.log('===========================', 'info');

    // Check if dependencies are installed
    if (!this.checkDependencies()) {
      process.exit(1);
    }

    const args = process.argv.slice(2);

    // Parse command line arguments
    const watchMode = args.includes('--watch') || args.includes('-w');
    const coverage = args.includes('--coverage') || args.includes('-c');
    const verbose = args.includes('--verbose') || args.includes('-v');
    const specific = args.find(arg => arg.startsWith('--testNamePattern='));

    const jestOptions: string[] = [];

    if (watchMode) {
      jestOptions.push('--watch');
      this.log('👀 Running in watch mode...', 'info');
    }

    if (coverage) {
      jestOptions.push('--coverage');
      this.log('📊 Collecting coverage information...', 'info');
    }

    if (verbose) {
      jestOptions.push('--verbose');
    }

    if (specific) {
      jestOptions.push(specific);
      this.log(`🎯 Running specific tests: ${specific.split('=')[1]}`, 'info');
    }

    // Run the tests
    this.runTests(jestOptions);
  }

  public static showHelp(): void {
    console.log(`
Polling App Test Runner

Usage: tsx src/__tests__/run-tests.ts [options]

Options:
  --watch, -w              Run tests in watch mode
  --coverage, -c           Collect and report test coverage
  --verbose, -v            Display individual test results
  --testNamePattern=<pattern>  Run tests matching the pattern
  --help, -h               Show this help message

Examples:
  tsx src/__tests__/run-tests.ts                          # Run all tests
  tsx src/__tests__/run-tests.ts --watch                  # Run in watch mode
  tsx src/__tests__/run-tests.ts --coverage               # Run with coverage
  tsx src/__tests__/run-tests.ts --testNamePattern=login  # Run only login tests
`);
  }
}

/**
 * Entrypoint invoked when the script is executed directly; parses CLI args and runs the test runner.
 *
 * If `--help` or `-h` is present, prints help via `TestRunner.showHelp()` and exits the process with code 0.
 * Otherwise constructs a `TestRunner` and awaits its `run()` method to execute the configured test flow.
 *
 * @returns A promise that resolves when the runner finishes. This function may terminate the process early when help is requested.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    TestRunner.showHelp();
    process.exit(0);
  }

  const runner = new TestRunner();
  await runner.run();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default TestRunner;
