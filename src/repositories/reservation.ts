import { pool } from "../database/pool.js";
import type { Reserve } from "../models/reserve.js";

export async function listReservations(date?: string): Promise<Reserve[]> {
    const result = await pool.query<Reserve>(`
        SELECT 
            id, 
            client_name AS "clientName",
            to_char(reservation_date, 'YYYY-MM-DD') AS "date",
            people_amount AS "peopleAmount"
        FROM reservations
        WHERE ($1::date IS NULL OR reservation_date = $1::date)
        ORDER BY id
        `,
        [date ?? null]
    );
    return result.rows;
};

export async function createReservation(input: Omit<Reserve, "id">): Promise<Reserve> {
    const result = await pool.query<Reserve> (
        `
        INSERT INTO reservations (
            client_name,
            reservation_date,
            people_amount
        )
        VALUES ($1, $2::date, $3)
        RETURNING 
            id,
            client_name AS "clientName",
            to_char(reservation_date, 'YYYY-MM-DD') AS "date",
            people_amount AS "peopleAmount"
        `,
        [input.clientName, input.date, input.peopleAmount]
    );

    const reservation = result.rows[0];

    if (reservation === undefined) {
        throw new Error("Insert did not return a reservation");
    }

    return reservation;
};

export async function findReservationById(id: number): Promise<Reserve | undefined> {
    const result = await pool.query<Reserve> (
        `
        SELECT
            id, 
            client_name AS "clientName",
            to_char(reservation_date, 'YYYY-MM-DD') AS "date",
            people_amount AS "peopleAmount"
            FROM reservations
            WHERE id = $1::bigint
            `,
            [id]
    );
    
    return result.rows[0];
};

export async function updateReservation(id: number, input: Omit<Reserve, "id">): Promise<Reserve | undefined> {
    const result = await pool.query<Reserve> (
        `
        UPDATE reservations
        SET 
            client_name = $2,
            reservation_date = $3::date,
            people_amount = $4
        WHERE id = $1::bigint
        RETURNING
            id,
            client_name AS "clientName",
            to_char(reservation_date, 'YYYY-MM-DD') AS "date",
            people_amount AS "peopleAmount"
        `,
        [id, input.clientName, input.date, input.peopleAmount]
    );

    return result.rows[0];
};

export async function deleteReservation(id: number): Promise<boolean> {
    const result = await pool.query(
        "DELETE FROM reservations WHERE id = $1::bigint",
        [id]
    );

    return result.rowCount === 1;
}