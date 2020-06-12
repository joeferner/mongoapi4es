module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/",
        "/public/dist/"
    ],
    transform: {
        ".(ts|tsx)": "ts-jest"
    },
    globals: {
        "ts-jest": {
            "compiler": "ttypescript"
        }
    },
    setupFilesAfterEnv: ['./jest.setup.js'],
};
