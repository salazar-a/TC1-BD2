export function isCalendarDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
    } 

    const interpretedDate = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(interpretedDate.getTime()) &&
        interpretedDate.toISOString().slice(0, 10) === date
    );
}

export function getTodayInCostaRica(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}