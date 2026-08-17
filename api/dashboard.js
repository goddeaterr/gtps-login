import { readRawBody, b64encode } from "./_token.js";

/* the raw body is the client's own block - it must not be reshaped */
export const config = { api: { bodyParser: false } };

/* Escapes text going into an HTML attribute. */
function escapeAttr(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
    let body = "";
    try {
        body = await readRawBody(req);
    } catch {
        body = "";
    }

    /*
        Some clients send their block in the query string instead of the body.
        Take whichever turned up - without it the token carries no rid, and the
        game server cannot match the reconnect to this login.
    */
    if (!body) {
        const q = req.url.indexOf("?");
        if (q !== -1) body = req.url.slice(q + 1);
    }

    const token = escapeAttr(b64encode(body));

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    /*
        A PLAIN FORM POST - deliberately, and this is the whole trick.

        The Growtopia client does not read this page's JavaScript. It watches
        where the webview navigates and reads the JSON body it lands on, so the
        browser itself has to submit the form and come to rest on
        /player/growid/login/validate.

        An earlier version used XMLHttpRequest and then redirected. The client
        never saw the response, and the redirect sent the webview at the game
        server by IP - no SNI, self-signed certificate, rejected handshake, and
        the game reported it as "error occurred: 404". No JS may intercept this
        submit.
    */
    res.end(`<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>GrowID Login</title><style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#10151c;color:#e8eef5;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.card{width:100%;max-width:340px;padding:28px 24px;background:#182029;
border:1px solid #26313d;border-radius:14px}
h1{margin:0 0 4px;font-size:20px;text-align:center}
p.sub{margin:0 0 22px;font-size:12px;text-align:center;color:#7f8b99}
label{display:block;font-size:12px;margin:14px 0 6px;color:#9dabb9}
input[type=text],input[type=password]{width:100%;padding:12px;font-size:16px;color:#e8eef5;
background:#0f141a;border:1px solid #2c3845;border-radius:8px;outline:none}
input[type=text]:focus,input[type=password]:focus{border-color:#4d8fd6}
input[type=submit]{width:100%;margin-top:22px;padding:13px;font-size:15px;font-weight:600;
color:#fff;background:#3d7ebf;border:0;border-radius:8px;cursor:pointer}
input[type=submit]:active{background:#336ba3}
.note{margin-top:18px;font-size:11px;line-height:1.5;text-align:center;color:#6b7784}
</style></head><body>
<div class="card">
<h1>GrowID Login</h1>
<p class="sub">private server</p>
<form method="POST" action="/player/growid/login/validate" accept-charset="UTF-8" autocomplete="off">
<input type="hidden" name="_token" value="${token}">
<label for="g">GrowID</label>
<input type="text" id="g" name="growId" autocapitalize="off" autocorrect="off" required>
<label for="p">Password</label>
<input type="password" id="p" name="password" required>
<input type="submit" value="Log in">
</form>
<p class="note">A name that doesn't exist yet is created on first login.<br>
Use a password you don't use anywhere else.</p>
</div>
<script>
/* Input filtering only. Nothing here touches the submit - see the note above:
   the browser must navigate to the action URL for the client to see the token.
   '&' is excluded because the token is &-delimited and would be cut short. */
document.getElementById('g').addEventListener('input',function(){
  this.value=this.value.replace(/[^A-Za-z0-9]/g,'');
});
document.getElementById('p').addEventListener('input',function(){
  this.value=this.value.replace(/[^A-Za-z0-9@._!\\-]/g,'');
});
</script>
</body></html>`);
}
