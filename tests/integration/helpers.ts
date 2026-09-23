import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getTodayInCostaRica } from "../../src/validation/date.js";

type Role = { id: string; name: string };

const appBaseUrl = "http://127.0.0.1:3000";
const keycloakBaseUrl = `http://localhost:${process.env.KEYCLOAK_PORT ?? "8080"}`;

export function reservationData(offset = 1) {

    const date = new Date(`${getTodayInCostaRica()}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + offset);

    return { clientName: `Daniel ${randomUUID()}`, date: date.toISOString().slice(0, 10), peopleAmount: 2 };

}

export async function sendRequest(path: string, options: RequestInit = {}) {

    const response = await fetch(`${appBaseUrl}${path}`, options);
    const text = await response.text();

    return { status: response.status, body: text ? JSON.parse(text) : null };

}

export function jsonOptions(method: string, body: unknown, token?: string): RequestInit {

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if(token !== undefined) headers.Authorization = `Bearer ${token}`;

    return { method, headers, body: JSON.stringify(body) };

}

export function tokenOptions(method: string, token: string): RequestInit {
    return { method, headers: { Authorization: `Bearer ${token}` } };
}

async function getAccessToken(realm: string, parameters: Record<string, string>): Promise<string> {

    const response = await fetch(`${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`, {
        method: "POST",
        body: new URLSearchParams(parameters)
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { access_token: string };

    return body.access_token;

}

export function getWriterToken(): Promise<string> {

    return getAccessToken("reservations", {
        grant_type: "client_credentials",
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!
    });

}

export function getAdminToken(): Promise<string> {

    return getAccessToken("master", {
        grant_type: "password",
        client_id: "admin-cli",
        username: process.env.KC_BOOTSTRAP_ADMIN_USERNAME!,
        password: process.env.KC_BOOTSTRAP_ADMIN_PASSWORD!
    });

}

export async function getServiceAccountRole(token: string): Promise<{ userId: string; role: Role }> {

    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const headers = { Authorization: `Bearer ${token}` };
    const clientsResponse = await fetch(`${keycloakBaseUrl}/admin/realms/reservations/clients?clientId=${encodeURIComponent(clientId)}`, { headers });
    assert.equal(clientsResponse.status, 200);
    const clients = await clientsResponse.json() as { id: string; clientId: string }[];
    const client = clients.find(value => value.clientId === clientId);
    assert.ok(client);

    const userResponse = await fetch(`${keycloakBaseUrl}/admin/realms/reservations/clients/${client.id}/service-account-user`, { headers });
    assert.equal(userResponse.status, 200);
    const user = await userResponse.json() as { id: string };
    const rolesResponse = await fetch(`${keycloakBaseUrl}/admin/realms/reservations/users/${user.id}/role-mappings/realm`, { headers });
    assert.equal(rolesResponse.status, 200);
    const roles = await rolesResponse.json() as Role[];
    const role = roles.find(value => value.name === "reservation_writer");
    assert.ok(role);

    return { userId: user.id, role };

}

export async function setServiceAccountRole(token: string, userId: string, role: Role, method: "POST" | "DELETE"): Promise<void> {

    const response = await fetch(`${keycloakBaseUrl}/admin/realms/reservations/users/${userId}/role-mappings/realm`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([role])
    });
    assert.equal(response.status, 204);

}
