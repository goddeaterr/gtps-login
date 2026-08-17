import { readRawBody, parseForm, buildToken, sendJson } from "./_token.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    let raw = "";
    try {
        raw = await readRawBody(req);
    } catch {
        return sendJson(res, 200, { status: "error", message: "That request was too large." });
    }

    const form = parseForm(raw);
    const growId = form.growId || "";
    const password = form.password || "";

    if (!growId || !password) {
        return sendJson(res, 200, {
            status: "error",
            message: "Enter both a GrowID and a password.",
        });
    }

    /*
        The token is `growId=..&password=..&_token=..` and the game server reads
        each field up to the next '&'. A password containing one would be cut
        short there - and cut short identically when the account was created,
        so it would appear to work while the real password was only the part
        before the '&'. Refuse it rather than silently shorten it.
    */
    if (growId.includes("&") || password.includes("&")) {
        return sendJson(res, 200, {
            status: "error",
            message: "Sorry, '&' can't be used here. Please pick another password.",
        });
    }

    /*
        No password check here, deliberately. This deployment has no account
        list to check against - the game server validates on connect and is
        the only place that can. All this does is pack the fields into the
        token shape the client expects.

        Nothing is logged: the password is in this request, and Vercel's
        function logs would otherwise keep it.
    */
    const token = buildToken(growId, password, form._token || "");

    return sendJson(res, 200, {
        status: "success",
        message: "Account Validated.",
        token,
        url: "",
        accountType: "growtopia",
    });
}
