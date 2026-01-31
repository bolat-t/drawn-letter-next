// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide path to Next.js app for loading next.config and .env files
    dir: './',
});



const config = {
    // Setup file for testing-library
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Use jsdom for browser-like environment
    testEnvironment: 'jsdom',

    // Module path aliases matching tsconfig
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Coverage configuration
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'utils/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
        '**/?(*.)+(test|spec).(ts|tsx|js|jsx)',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
    ],
};

module.exports = createJestConfig(config);
