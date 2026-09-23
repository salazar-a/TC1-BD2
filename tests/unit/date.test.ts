import { expect, test } from "@jest/globals";
import { getTodayInCostaRica, isCalendarDate } from "../../src/validation/date.js";

test("Accepts February 29 in a leap year", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true);
});

test("Rejects February 29 in a normal year", () => {
    expect(isCalendarDate("2025-02-29")).toBe(false);
});

test("Rejects invalid dates", () => {

    for(const date of ["2026-2-01", "2026-13-01", "2026-04-31", "not-a-date"]) {
        expect(isCalendarDate(date)).toBe(false);
    }

});

test("Gets today's date in Costa Rica", () => {

    const today = getTodayInCostaRica();

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isCalendarDate(today)).toBe(true);

});
