export function parseReservationId(value: string): number | undefined {
    //Validate range
    if (!/^[1-9]\d*$/.test(value)) {
        return undefined;
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id)) {
        return undefined;
    }

    return id;
}