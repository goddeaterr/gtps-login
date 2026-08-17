import {
    readRawBody, parseForm, b64encode, b64decode,
    buildToken, fieldOf, sendJson,
} from "./_token.js";

export const config = { api: { bodyParser: false } };

/*
    A client that has logged in before keeps its token and refreshes it here
    instead of opening the form - so it may never see the login page at all.
    Without this route that client gets a 404 and the login fails outright.
*/
export default async function handler(req, res) {
    let raw = "";
    try {
        raw = await readRawBody(req);
    } catch {
        return sendJson(res, 200, { status: "error", message: "Please sign in again." });
    }

    const form = parseForm(raw);
    const old = form.refreshToken || form._token || "";

    let decoded = "";
    try {
        decoded = b64decode(old);
    } catch {
        decoded = "";
    }

    const growId = fieldOf(decoded, "growId");
    const password = fieldOf(decoded, "password");

    if (!growId || !password) {
        /*
            An error is the right answer here, not a failure - the client falls
            back to showing the login form, which is what should happen when a
            stored token is stale or unreadable.
        */
        return sendJson(res, 200, { status: "error", message: "Please sign in again." });
    }

    /* carry the client's current block if it sent one, else keep the old */
    const clientBlock = form.clientData
        ? b64encode(form.clientData)
        : fieldOf(decoded, "_token");

    return sendJson(res, 200, {
        status: "success",
        message: "Account Validated.",
        token: buildToken(growId, password, clientBlock),
        url: "",
        accountType: "growtopia",
    });
}
