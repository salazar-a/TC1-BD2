import { execFileSync } from "node:child_process";
import { expect, test } from "@jest/globals";
import { getWriterToken, jsonOptions, reservationData, sendRequest } from "./helpers.js";

test("A reservation stays after the services restart", async () => {

    const token = await getWriterToken();
    const data = reservationData();
    const created = await sendRequest("/reservations", jsonOptions("POST", data, token));
    expect(created.status).toBe(201);
    expect(created.body).not.toBeNull();
    const reservation = created.body;

    execFileSync("docker", ["compose", "down"]);
    execFileSync("docker", ["compose", "up", "--wait"]);

    const restored = await sendRequest(`/reservations/${reservation.id}`);

    expect(restored.status).toBe(200);
    expect(restored.body).toEqual(reservation);

});
