import { execFileSync } from "node:child_process";
import { expect, test } from "@jest/globals";
import { sendRequest } from "./helpers.js";

test("Health returns 200", async () => {

    const health = await sendRequest("/health");

    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok" });

});

test("Ready returns 200 when the database works", async () => {

    const ready = await sendRequest("/ready");

    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({ status: "ready" });

});

test("Ready returns 503 when the database is down", async () => {

    execFileSync("docker", ["compose", "stop", "postgres"]);

    try {

        const health = await sendRequest("/health");
        const ready = await sendRequest("/ready");

        expect(health.status).toBe(200);
        expect(ready.status).toBe(503);
        expect(ready.body).toEqual({ status: "not_ready" });

    } finally {
        execFileSync("docker", ["compose", "start", "--wait", "postgres"]);
    }

});
