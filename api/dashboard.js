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
input{width:100%;padding:12px;font-size:16px;color:#e8eef5;background:#0f141a;
border:1px solid #2c3845;border-radius:8px;outline:none}
input:focus{border-color:#4d8fd6}
button{width:100%;margin-top:22px;padding:13px;font-size:15px;font-weight:600;
color:#fff;background:#3d7ebf;border:0;border-radius:8px;cursor:pointer}
button:active{background:#336ba3}
button:disabled{opacity:.6}
.err{margin-top:14px;padding:10px;font-size:13px;text-align:center;color:#ffb4b4;
background:#3a1f24;border:1px solid #5c2b33;border-radius:8px;display:none}
.note{margin-top:18px;font-size:11px;line-height:1.5;text-align:center;color:#6b7784}
</style></head><body>
<div class="card">
<h1>GrowID Login</h1>
<p class="sub">private server</p>
<form id="f">
<input type="hidden" name="_token" value="${token}">
<label for="g">GrowID</label>
<input id="g" name="growId" autocapitalize="off" autocorrect="off" autocomplete="username" required>
<label for="p">Password</label>
<input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit" id="b">Log in</button>
</form>
<div class="err" id="e"></div>
<p class="note">A name that doesn't exist yet is created on first login.<br>
Use a password you don't use anywhere else.</p>
</div>
<script>
document.getElementById('f').addEventListener('submit',function(ev){
ev.preventDefault();
var e=document.getElementById('e'),b=document.getElementById('b');
e.style.display='none';b.disabled=true;
var x=new XMLHttpRequest();
x.open('POST','/player/growid/login/validate',true);
x.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
x.onload=function(){
b.disabled=false;
try{
var r=JSON.parse(x.responseText);
if(r.status==='success'){
if(window.gtLogin)window.gtLogin(r.token);
location.href='https://127.0.0.1/?token='+encodeURIComponent(r.token);
}else{e.textContent=r.message||'Login failed.';e.style.display='block';}
}catch(_){e.textContent='The server sent something unreadable.';e.style.display='block';}
};
x.onerror=function(){b.disabled=false;e.textContent='Could not reach the server.';e.style.display='block';};
x.send(new URLSearchParams(new FormData(this)).toString());
});
</script></body></html>`);
}
