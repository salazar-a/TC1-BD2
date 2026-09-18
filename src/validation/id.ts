export function parseReservationId(value: unknown): number | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    
    //Validate range
    if (!/^[1-9]\d*$/.test(value)) {
        return undefined;
    }

    const id = Number(value);

    //Validate js integer 
    if (!Number.isSafeInteger(id)) {
        return undefined;
    }

    return id;
}