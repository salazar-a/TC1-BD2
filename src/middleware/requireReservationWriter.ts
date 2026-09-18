import type { RequestHandler } from "express";
import { errors } from "jose";
import type { JWTPayload } from "jose";
import { verifyAccessToken } from "../auth/token.js";

export const requireReservationWriter: RequestHandler = async (req, res, next) => {
    //Get the request's header and extract the token
    const authorization = req.get("Authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    //Check for and invalid credential
    if (!match) {
        res.set("WWW-Authenticate", "Bearer");
        res.status(401).json({ error: "A Bearer access token is required"});
        return;
    }

    let payload: JWTPayload;

    try {
        payload = await verifyAccessToken(match[1]);
    } catch (error) {
        const invalidToken =
            error instanceof errors.JWTExpired ||
            error instanceof errors.JWTClaimValidationFailed ||
            error instanceof errors.JWSSignatureVerificationFailed ||
            error instanceof errors.JWSInvalid ||
            error instanceof errors.JWTInvalid ||
            error instanceof errors.JOSEAlgNotAllowed ||
            error instanceof errors.JWKSNoMatchingKey;

        if (invalidToken) {
            res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
            res.status(401).json({ error: "Access token is invalid or expired"})
            return;
        }

        //Operation problem case handler, like not being able to download public keycloak keys
        console.error("Token verification unavailable:", error);
        res.status(503).json({ error: "Unable to verify access token"});
        return;
    }

    //Validate the realm_access structure before accessing its roles
    const realmAccess = payload.realm_access;

    const canWrite = 
        typeof realmAccess === "object" &&
        realmAccess !== null &&
        "roles" in realmAccess &&
        Array.isArray(realmAccess.roles) &&
        realmAccess.roles.includes("reservation_writer");

    //Token that successfully completed the verification, but lacks permission 
    if (!canWrite) {
        res.status(403).json({ error: "The reservation_writer role is required"});
        return;
    }

    next();
}