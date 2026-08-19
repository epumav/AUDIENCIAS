require("dotenv").config();
const http = require("http");
const { google } = require("googleapis");

const slot = process.argv[2];
if (!['1', '2'].includes(slot)) {
  console.error("Uso: npm run setup -- 1   o   npm run setup -- 2");
  process.exit(1);
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Primero coloca GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env");
  process.exit(1);
}

const PORT = 53682;
const redirectUri = `http://localhost:${PORT}/oauth2callback`;
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent select_account",
  scope: scopes
});

console.log(`\nCONFIGURANDO CUENTA ${slot}`);
console.log("1) Abre esta URL en tu navegador:");
console.log(authUrl);
console.log(`\n2) Autoriza la cuenta Gmail ${slot}.`);
console.log("3) El navegador volverá a localhost y este programa mostrará el refresh token.\n");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404).end("No encontrado");
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) throw new Error(url.searchParams.get("error") || "Google no devolvió un código.");

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error("Google no devolvió refresh_token. Revoca el acceso de la app y vuelve a ejecutar la configuración.");
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const profile = await oauth2.userinfo.get();

    console.log(`Correo autorizado: ${profile.data.email}`);
    console.log(`ACCOUNT${slot}_EMAIL=${profile.data.email}`);
    console.log(`ACCOUNT${slot}_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\nCopia esas dos líneas a tu .env o a las variables secretas del hosting del backend.");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Autorización completada</h2><p>Puedes cerrar esta pestaña y volver a la terminal.</p>");
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Error: ${error.message}`);
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 300);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Servidor temporal listo en ${redirectUri}`);
});
