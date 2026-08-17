# Your own GrowID login page

A drop-in replacement for `login-gurotopia.vercel.app`, deployed under **your**
Vercel account so nobody else can change the page your players type passwords
into.

Free, and players need no setup at all — Vercel issues a real certificate for
`*.vercel.app` automatically, which is exactly what self-hosting could not do
without every player installing your CA.

## What it does and does not do

It packs a GrowID and password into the token the Growtopia client expects.
**It never checks a password** — your game server does that on connect, in
`action::protocol`, and that stays the only place that can.

So this deployment has:

- no database
- no secrets or environment variables
- no connection back to your PC

Your game server does not have to be reachable from the internet for the login
page to work, and this page cannot let anyone in on its own.

## Deploy

1. Make a free account at <https://vercel.com>.

2. Install the CLI and deploy this folder:

   ```
   npm i -g vercel
   cd "C:\Users\admin\Desktop\gtps mine\login-page"
   vercel --prod
   ```

   Accept the defaults. It prints a URL like
   `https://your-project-name.vercel.app`.

3. Point the server at it — host only, no `https://`:

   ```
   scripts\set-login-url.ps1 your-project-name.vercel.app
   ```

4. Restart the server and the Growtopia client.

## Check it worked

Open `https://your-project-name.vercel.app/player/login/dashboard` in a browser.
You should get the login form with a padlock and no warning.

The server prints which host it is using at startup.

## Turn off request logging

Vercel keeps function logs by default. The password is in the request body of
`/player/growid/login/validate`, and while this code never writes it anywhere,
logs are worth turning down regardless:

**Project → Settings → Observability** and reduce log retention.

Even so, tell players to use a password they do not use anywhere else. That
advice holds for any private server, including this one.

## Renewal

None. Vercel renews the certificate itself.
