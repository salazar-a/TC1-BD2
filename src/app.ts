import express from "express";
import { isCalendarDate, getTodayInCostaRica } from "./validation/date.js";
import { validateReservation } from "./validation/reservation.js";
import { handleJsonError } from "./middleware/jsonError.js";
import { pool } from "./database/pool.js";
import { listReservations, createReservation, findReservationById, updateReservation, deleteReservation } from "./repositories/reservation.js";
import { parseReservationId } from "./validation/id.js";
import { requireReservationWriter } from "./middleware/requireReservationWriter.js";

export const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok"});
});

app.get("/ready", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ready" });
    } catch {
        res.status(503).json({ status: "not_ready" });
    }
});

app.get("/reservations", async (req, res) => {
    const date = req.query.date;

    //Filter by date if necessary
    if (date !== undefined) {
        if (typeof date !== "string" ||
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
            })
            return;
        }
    }

    //Consult the databse
    try {
        const result = await listReservations(date);
        res.status(200).json(result);
    } catch (error) {
        console.log("Failed to list reservations:", error);
        res.status(500).json({
            error: "Unable to retrieve reservations"
        });
    }
});

app.get("/reservations/:id", async (req, res) => {

    //Parse and validate id
    const id = parseReservationId(req.params.id);

    if (id === undefined) {
        res.status(400).json({error: "Reservation ID must be a positive safe integer"});
        return;
    }

    //Search for the reservation
    try {
        const reservation = await findReservationById(id);

        if (reservation === undefined) {
            res.status(404).json({error: "Reservation not found"});
            return; 
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("Failed to retrieve reservation:", error);
        res.status(500).json({error: "Unable to retrieve reservation"});
    }
});

app.post("/reservations", requireReservationWriter, async (req, res) => {
    const result = validateReservation(req.body, getTodayInCostaRica());

    //Bad input case
    if (!result.ok) {
        res.status(400).json({error: result.error});
        return;
    }

    try {
        const reservation = await createReservation(result.value);
        res.status(201).json(reservation);
    } catch (error) {
        console.error("Failed to create reservation:", error);
        res.status(500).json({error: "Unable to create reservation"});
    }
});

app.put("/reservations/:id", requireReservationWriter, async (req, res) => {
    //Parse and validate id
    const id = parseReservationId(req.params.id);

    if (id === undefined) {
        res.status(400).json({error: "Reservation ID must be a positive safe integer"});
        return;
    }

    const result = validateReservation(req.body, getTodayInCostaRica());

    //Give a response based on the validation's output
    if (!result.ok) {
        res.status(400).json({error: result.error});
        return;
    }

    try {
        const reservation = await updateReservation(id, result.value);

        if (reservation === undefined) {
            res.status(404).json({error: "Reservation not found"});
            return;
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("Failed to update reservation:", error);
        res.status(500).json({error: "Unable to update reservation"});
    }
});

app.delete("/reservations/:id", requireReservationWriter, async (req, res) => {
    //Parse and validate id
    const id = parseReservationId(req.params.id);

    if (id === undefined) {
        res.status(400).json({error: "Reservation ID must be a positive safe integer"});
        return;
    }

    try {
        const deleted = await deleteReservation(id);

        if (!deleted) {
            res.status(404).json({error: "Reservation not found"});
            return;
        }

        res.status(204).end();
    } catch (error) {
        console.error("Failed to delete reservation:", error);
        res.status(500).json({error: "Unable to delete reservation"});
    }
});

app.use(handleJsonError);

