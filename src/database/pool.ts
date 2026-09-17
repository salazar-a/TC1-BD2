import { Pool } from "pg";

function requireEnv(name: string): string {
    const value = process.env[name];

    if (value === undefined || value.length === 0) {
        throw new Error(`Environment variable ${name} must be a set`);
    }

    return value;
}

const port = Number(requireEnv("POSTGRES_PORT"));

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("POSTGRES_PORT must be an integer between 1 and 65535");
}

export const pool = new Pool({
    host: requireEnv("POSTGRES_HOST"),
    port,
    database: requireEnv("POSTGRES_DB"),
    user: requireEnv("POSTGRES_USER"),
    password: requireEnv("POSTGRES_PASSWORD"),
    connectionTimeoutMillis: 5000,
});

pool.on("error", (error: Error) => {
    console.error("Unexpected PostgreSQL pool error", error.message);
});