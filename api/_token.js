/*
    Shared helpers for the three login routes.

    Nothing here checks a password. The game server does that - see
    action::protocol - and it is the only place that ever should. These
    functions exist purely to pack credentials into the token shape the
    Growtopia client expects, which is why this deployment needs no database,
    no secrets and no connection back to the game server.
*/

/*
    Reads the raw request body.

    The client posts its own key|value block here, and it has to come back
    byte for byte inside the token: the game server digs the `rid` out of it,
    and that rid is what ties the login to the reconnect that follows. Anything
    that reformats the body breaks that link, so it is never parsed as JSON or
    form data - just collected.
*/
export function readRawBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
            // a real client block is well under this; anything larger is junk
            if (body.length > 65536) {
                reject(new Error("body too large"));
                req.destroy();
            }
        });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

/* Parses an urlencoded form body into a plain object. */
export function parseForm(body) {
    const out = {};
    for (const pair of String(body || "").split("&")) {
        if (!pair) continue;
        const eq = pair.indexOf("=");
        if (eq === -1) continue;

        const key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, " "));
        out[key] = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, " "));
    }
    return out;
}

export const b64encode = (s) => Buffer.from(String(s), "utf8").toString("base64");
export const b64decode = (s) => Buffer.from(String(s), "base64").toString("utf8");

/*
    Builds the ltoken.

    This is the exact shape action::protocol parses back out - see the
    growId= / password= / _token= reads there. _token stays base64 because
    that is how it is unpacked on the other side.
*/
export function buildToken(growId, password, clientBlockB64) {
    return b64encode(
        `growId=${growId}&password=${password}&_token=${clientBlockB64 || ""}`
    );
}

/* Pulls a single field out of an already-decoded token. */
export function fieldOf(decoded, key) {
    const at = decoded.indexOf(`${key}=`);
    if (at === -1) return "";

    const from = at + key.length + 1;
    const end = decoded.indexOf("&", from);
    return decoded.slice(from, end === -1 ? undefined : end);
}

export function sendJson(res, status, object) {
    res.status(status);
    res.setHeader("Content-Type", "application/json");
    // credentials pass through here; never let anything cache a response
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(object));
}
