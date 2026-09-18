import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload } from "jose";

function requireEnv(name: string): string {
    const value = process.env[name];

    if (value === undefined || value.length === 0) {
        throw new Error(`Enviroment variable ${name} must be a set`);
    }
    
    return value;
}

const issuer = requireEnv("OIDC_ISSUER");
const audience = requireEnv("OIDC_AUDIENCE");

const jwks = createRemoteJWKSet(new URL(requireEnv("OIDC_JWKS_URL")), { timeoutDuration: 5000 });

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience,
        algorithms: ["RS256"],
        requiredClaims: ["exp", "sub"]
    });

    return payload;
};