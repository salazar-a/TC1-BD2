import express from "express";
import type { Reserve } from "./models/reserve.js";
import { isCalendarDate, getTodayInCostaRica } from "./validation/date.js";
import { validateReservation } from "./validation/reservation.js";
import { handleJsonError } from "./middleware/jsonError.js";

export const app = express();
const reservations: Reserve[] = [];
let nextId = 1;

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok"});
});

app.get("/reservations", (req, res) => {
    const date = req.query.date;

    //Return all
    if (date === undefined) {
        res.status(200).json(reservations);
        return;
    }
    
    //Return filtered ones
    //Validation section
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        res.status(400).json({
            error: "Date filter must have the format YYYY-MM-DD"
        });
        return;
    }

    if (!isCalendarDate(date)) {
        res.status(400).json({
            error: "Date filter must exist in the calendar"
        });
        return;
    }

    //Filter
    const filteredReservations = reservations.filter(
        reservation => reservation.date === date
    );

    res.status(200).json(filteredReservations)
});

app.get("/reservations/:id", (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);

    //Verify integer input
    if (
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(id)
    ) {
        res.status(400).json({
            error: "Reservation ID must be a positive safe integer"
        });
        return;
    }

    //Search for the reservation
    const reservation = reservations.find(
        reservation => reservation.id === id
    );

    if (reservation === undefined) {
        res.status(404).json({
            error: "Reservation not found"
        });
        return;
    }

    res.status(200).json(reservation);
})

app.post("/reservations", (req, res) => {
    const result = validateReservation(req.body, getTodayInCostaRica());

    //Give a response based on the validation's output
    if (!result.ok) {
        res.status(400).json({
            error: result.error
        });
        return;
    }

    const reservation: Reserve = {
        id: nextId,
        ...result.value
    };

    //Update registers
    reservations.push(reservation);
    nextId +=1;

    res.status(201).json(reservation)

});

app.put("/reservations/:id", (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);

    //Verify integer input
    if (
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(id)
    ) {
        res.status(400).json({
        error: "Reservation ID must be a positive safe integer"
        });
        return;
    }

    //Find index
    const index = reservations.findIndex(
        reservation => reservation.id === id
    );

    if (index === -1) {
        res.status(404).json({
        error: "Reservation not found"
        });
        return;
    }

    const result = validateReservation(req.body, getTodayInCostaRica());

    //Give a response based on the validation's output
    if (!result.ok) {
        res.status(400).json({
        error: result.error
        });
        return;
    }

    const updatedReservation: Reserve = {
        id,
        ...result.value
    };

    reservations[index] = updatedReservation;

    res.status(200).json(updatedReservation);
})

app.delete("/reservations/:id", (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);

    //Verify integer input
    if (
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(id)
    ) {
        res.status(400).json({
        error: "Reservation ID must be a positive safe integer"
        });
        return;
    }

    //Find index
    const index = reservations.findIndex(
        reservation => reservation.id === id
    );

    if (index === -1) {
        res.status(404).json({
        error: "Reservation not found"
        });
        return;
    } 

    reservations.splice(index, 1);
    
    res.status(204).end();
})

app.use(handleJsonError);

//GET, PUT and DELETE all use the same logic to validate the integer input, cant this be done with a function?