import { expect, test } from "@jest/globals";
import { getAdminToken, getServiceAccountRole, getWriterToken, jsonOptions, reservationData, sendRequest, setServiceAccountRole, tokenOptions } from "./helpers.js";

test("Requests without a token return 401", async () => {

    const created = await sendRequest("/reservations", jsonOptions("POST", reservationData()));
    const updated = await sendRequest("/reservations/1", jsonOptions("PUT", reservationData()));
    const deleted = await sendRequest("/reservations/1", { method: "DELETE" });

    expect(created.status).toBe(401);
    expect(updated.status).toBe(401);
    expect(deleted.status).toBe(401);

});

test("A token with a wrong signature returns 401", async () => {

    const token = await getWriterToken();
    const segments = token.split(".");
    segments[2] = `${segments[2][0] === "A" ? "B" : "A"}${segments[2].slice(1)}`;
    const response = await sendRequest("/reservations", jsonOptions("POST", reservationData(), segments.join(".")));

    expect(response.status).toBe(401);

});

test("A writer token can create and delete a reservation", async () => {

    const token = await getWriterToken();
    const created = await sendRequest("/reservations", jsonOptions("POST", reservationData(), token));

    expect(created.status).toBe(201);
    expect(created.body).not.toBeNull();

    const deleted = await sendRequest(`/reservations/${created.body.id}`, tokenOptions("DELETE", token));

    expect(deleted.status).toBe(204);

});

test("A token without the writer role returns 403", async () => {

    const adminToken = await getAdminToken();
    const { userId, role } = await getServiceAccountRole(adminToken);
    await setServiceAccountRole(adminToken, userId, role, "DELETE");

    try {

        const token = await getWriterToken();
        const created = await sendRequest("/reservations", jsonOptions("POST", reservationData(), token));
        const updated = await sendRequest("/reservations/1", jsonOptions("PUT", reservationData(), token));
        const deleted = await sendRequest("/reservations/1", tokenOptions("DELETE", token));

        expect(created.status).toBe(403);
        expect(updated.status).toBe(403);
        expect(deleted.status).toBe(403);

    } finally {
        await setServiceAccountRole(adminToken, userId, role, "POST");
    }

});
