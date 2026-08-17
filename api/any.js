import dashboard from "./dashboard.js";
import validate from "./validate.js";
import checktoken from "./checktoken.js";

export const config = { api: { bodyParser: false } };

/*
    Catch-all for every login route not matched explicitly.

    Growtopia clients differ in which endpoints they call - versions have moved
    the validate and token-refresh paths around, and a path we do not serve
    comes back as a plain 404, which the game reports as
    "During login request error occurred: 404" with no clue which URL it was.

    So instead of 404ing, the request is matched on what the path contains and
    handed to the right handler. The path is logged too, so the deployment logs
    name the exact URL the client wanted.
*/
export default async function handler(req, res) {
    const path = (req.url || "").split("?")[0];

    // the path only - never the body, which holds the password
    console.log(`[login] ${req.method} ${path}`);

    if (path.includes("checktoken") || path.includes("refresh")) {
        return checktoken(req, res);
    }
    if (path.includes("validate") || path.includes("login/growid")) {
        return validate(req, res);
    }
    return dashboard(req, res);
}
