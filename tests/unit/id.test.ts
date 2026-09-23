import { expect, test } from "@jest/globals";
import { parseReservationId } from "../../src/validation/id.js";

test("Accepts valid reservation IDs", () => {

    expect(parseReservationId("1")).toBe(1);
    expect(parseReservationId("42")).toBe(42);
    expect(parseReservationId(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);

});

test("Rejects invalid reservation IDs", () => {

    for(const id of ["0", "-1", "01", "1.5", "1e3", "9007199254740992", "abc", null]) {
        expect(parseReservationId(id)).toBeUndefined();
    }

});
