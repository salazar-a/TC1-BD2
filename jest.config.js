import { loadEnvFile } from "node:process";

loadEnvFile(".env.example");

export default {
    roots: ["<rootDir>/tests"],
    moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
    maxWorkers: 1,
    testTimeout: 300000
};
