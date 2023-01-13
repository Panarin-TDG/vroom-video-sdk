module.exports = {
  verbose: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.test.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['<rootDir>/test.js'],
}
