import { expect, test } from "@jest/globals";
import { getWriterToken, jsonOptions, reservationData, sendRequest, tokenOptions } from "./helpers.js";

test("Lists reservations with and without a date filter", async () => {

    const token = await getWriterToken();
    const firstData = reservationData(1);
    const secondData = reservationData(2);

    const first = await sendRequest("/reservations", jsonOptions("POST", firstData, token));
    expect(first.status).toBe(201);
    expect(first.body).not.toBeNull();
    const firstReservation = first.body;
    expect(firstReservation).toEqual({ id: firstReservation.id, ...firstData });

    const second = await sendRequest("/reservations", jsonOptions("POST", secondData, token));
    expect(second.status).toBe(201);
    expect(second.body).not.toBeNull();
    const secondReservation = second.body;

    const all = await sendRequest("/reservations");
    expect(all.status).toBe(200);
    const allReservations = all.body as { id: number }[];
    expect(allReservations.some(reservation => reservation.id === firstReservation.id)).toBe(true);
    expect(allReservations.some(reservation => reservation.id === secondReservation.id)).toBe(true);

    const filtered = await sendRequest(`/reservations?date=${firstData.date}`);
    expect(filtered.status).toBe(200);
    const filteredReservations = filtered.body as { id: number }[];
    expect(filteredReservations.some(reservation => reservation.id === firstReservation.id)).toBe(true);
    expect(filteredReservations.some(reservation => reservation.id === secondReservation.id)).toBe(false);

});

test("Finds a reservation, then updates and deletes it", async () => {

    const token = await getWriterToken();
    const data = reservationData();
    const created = await sendRequest("/reservations", jsonOptions("POST", data, token));
    expect(created.status).toBe(201);
    expect(created.body).not.toBeNull();
    const id = created.body.id;

    const found = await sendRequest(`/reservations/${id}`);
    expect(found.status).toBe(200);
    expect(found.body).toEqual(created.body);

    const updatedData = { ...data, peopleAmount: 4 };
    const updated = await sendRequest(`/reservations/${id}`, jsonOptions("PUT", updatedData, token));
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ id, ...updatedData });

    const deleted = await sendRequest(`/reservations/${id}`, tokenOptions("DELETE", token));
    expect(deleted.status).toBe(204);
    expect(deleted.body).toBeNull();

    const missing = await sendRequest(`/reservations/${id}`);
    expect(missing.status).toBe(404);

});

test("Invalid data returns 400 and missing reservations return 404", async () => {

    const token = await getWriterToken();
    const missingId = Number.MAX_SAFE_INTEGER;
    const invalidBody = await sendRequest("/reservations", jsonOptions("POST", { clientName: "Daniel" }, token));
    const invalidJson = await sendRequest("/reservations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{invalid"
    });
    const invalidFilter = await sendRequest("/reservations?date=2026-02-29");
    const missingGet = await sendRequest(`/reservations/${missingId}`);
    const invalidPut = await sendRequest(`/reservations/${missingId}`, jsonOptions("PUT", { clientName: "Daniel" }, token));
    const missingPut = await sendRequest(`/reservations/${missingId}`, jsonOptions("PUT", reservationData(), token));
    const missingDelete = await sendRequest(`/reservations/${missingId}`, tokenOptions("DELETE", token));

    expect(invalidBody.status).toBe(400);
    expect(invalidJson.status).toBe(400);
    expect(invalidFilter.status).toBe(400);
    expect(missingGet.status).toBe(404);
    expect(invalidPut.status).toBe(400);
    expect(missingPut.status).toBe(404);
    expect(missingDelete.status).toBe(404);

});
