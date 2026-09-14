import type { ErrorRequestHandler } from "express"; 

export const handleJsonError: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    next
) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.parse.failed"
    ) {
        res.status(400).json({
            error: "Request body must contain valid JSON"
        });
        return;
    }

    next(error);
}