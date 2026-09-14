import type { Reserve } from "../models/reserve.js";
import { isCalendarDate } from "./date.js";

type ReservationInput = Omit<Reserve, "id">;

type ValidationResult = 
    | { ok: true; value: ReservationInput }
    | { ok: false; error: string };

export function validateReservation(data: unknown, today: string): ValidationResult {
    //General data validation
    if (
        typeof data != "object" ||
        data === null ||
        Array.isArray(data)
    ) {
        return { ok: false, error: "Body must be a JSON object"};
    }

    //Amount of people validation
    if (
        !("peopleAmount" in data) ||
        typeof data.peopleAmount !== "number" ||
        !Number.isInteger(data.peopleAmount) ||
        data.peopleAmount <= 0
    ) {
        return {
        ok: false,
        error: "The amount of people must be a positive integer"
        };
    }

    //Name validation
    if (
        !("clientName" in data) ||
        typeof data.clientName !== "string" ||
        data.clientName.trim().length === 0
    ) {
        return {
        ok: false,
        error: "A client's name must be a non-empty text"
        };
    }

    //Date validation
    if (
        !("date" in data) ||
        typeof data.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
    ) {
        return {
        ok: false,
        error: "Date must have the following format: YYYY-MM-DD"
        };
    }

    if (!isCalendarDate(data.date)) {
        return { ok: false, error: "Date must exist in the calendar" };
    }

    if (data.date < today) {
        return {
        ok: false,
        error: "Reservation date cannot be in the past"
        };
    }

    return {
        ok: true,
        value: {
        clientName: data.clientName.trim(),
        date: data.date,
        peopleAmount: data.peopleAmount
        }
    };
}