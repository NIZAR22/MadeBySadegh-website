module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    // Same alias as vue.config.js, so components can import the client
    // config in tests too (tests mostly pass fixture configs as props instead)
    '^@site-config$': '<rootDir>/site-config.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Stylesheets aren't needed to test behaviour
    '\\.css$': '<rootDir>/tests/unit/style-stub.js'
  },
  testMatch: [
    '**/tests/unit/**/*.spec.[jt]s?(x)',
    '**/__tests__/*.[jt]s?(x)'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js']
}
