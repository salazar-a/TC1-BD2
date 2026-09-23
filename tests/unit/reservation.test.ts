import { expect, test } from "@jest/globals";
import { validateReservation } from "../../src/validation/reservation.js";

const today = "2026-09-22";
const validInput = { clientName: "Daniel", date: today, peopleAmount: 2 };

test("Accepts a valid reservation and trims the name", () => {
    const result = validateReservation({ ...validInput, clientName: "  Daniel  " }, today);
    expect(result).toEqual({ ok: true, value: validInput });
});

test("Rejects data that is not an object", () => {

    for(const body of [null, [], "text", 1]) {
        expect(validateReservation(body, today).ok).toBe(false);
    }

});

test("Rejects invalid people counts", () => {

    for(const peopleAmount of [undefined, 0, -1, 1.5, "2"]) {
        expect(validateReservation({ ...validInput, peopleAmount }, today).ok).toBe(false);
    }

});

test("Rejects missing or blank names", () => {

    for(const clientName of [undefined, "", "   ", 4]) {
        expect(validateReservation({ ...validInput, clientName }, today).ok).toBe(false);
    }

});

test("Rejects invalid or past dates", () => {

    for(const date of [undefined, "2026-09-21", "2026-02-29", "2026-9-22", 20260922]) {
        expect(validateReservation({ ...validInput, date }, today).ok).toBe(false);
    }

});
