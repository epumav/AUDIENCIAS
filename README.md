# Calendario semanal automático de dos cuentas Gmail

Versión 2 del proyecto. La página de GitHub Pages **ya no pide iniciar sesión en Gmail ni ingresar contraseña cada vez que se abre**.

## Qué muestra

Para cada evento de la semana muestra:

- fecha;
- hora de inicio y fin;
- correo Gmail al que pertenece;
- enlace de Google Meet, cuando existe.

## Arquitectura

GitHub Pages solo aloja archivos estáticos (HTML, CSS y JavaScript), por lo que los secretos de Google no pueden guardarse allí. Esta versión separa el proyecto en:

- **Frontend GitHub Pages:** `index.html`, `styles.css`, `app.js`, `config.js`.
- **Backend privado:** carpeta `backend/`.
- **Autorización inicial:** se realiza una sola vez por cada cuenta con `backend/setup-token.js`.

Las contraseñas Gmail **no se guardan en ningún archivo**. El backend usa refresh tokens de Google OAuth 2.0 para obtener nuevos access tokens automáticamente.

---

# 1. Google Cloud

1. Crea o selecciona un proyecto en Google Cloud.
2. Habilita **Google Calendar API**.
3. Configura la pantalla de consentimiento OAuth.
4. Crea un **OAuth Client ID** de tipo **Web application**.
5. Agrega esta URI en **Authorized redirect URIs**:

   `http://localhost:53682/oauth2callback`

6. Si la aplicación está en modo de prueba, agrega las dos cuentas Gmail como usuarios de prueba.
7. Guarda el **Client ID** y **Client Secret**.

---

# 2. Obtener autorización permanente de las dos cuentas

Necesitas Node.js 20 o superior.

Abre una terminal dentro de `backend` y ejecuta:

```bash
npm install
```

Copia `.env.example` como `.env` y completa primero:

```env
GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET
```

## Cuenta 1

```bash
npm run setup -- 1
```

El programa mostrará una URL. Ábrela, selecciona la primera cuenta Gmail y autoriza el acceso. Al finalizar la terminal mostrará:

```env
ACCOUNT1_EMAIL=correo1@gmail.com
ACCOUNT1_REFRESH_TOKEN=...
```

Copia esas líneas a `.env`.

## Cuenta 2

```bash
npm run setup -- 2
```

Autoriza la segunda cuenta y copia:

```env
ACCOUNT2_EMAIL=correo2@gmail.com
ACCOUNT2_REFRESH_TOKEN=...
```

**No subas `.env` a GitHub.** Ya está excluido mediante `.gitignore`.

---

# 3. Probar el backend localmente

Completa también:

```env
FRONTEND_ORIGIN=http://127.0.0.1:5500
TIMEZONE=America/Lima
```

Luego ejecuta:

```bash
npm start
```

El backend quedará normalmente en:

`http://localhost:3000`

Puedes comprobar:

`http://localhost:3000/health`

---

# 4. Publicar el backend

El backend necesita un servicio que ejecute Node.js. Puedes usar el proveedor que prefieras.

Configura allí como variables de entorno, **no como archivos públicos**:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ACCOUNT1_EMAIL=...
ACCOUNT1_REFRESH_TOKEN=...
ACCOUNT2_EMAIL=...
ACCOUNT2_REFRESH_TOKEN=...
TIMEZONE=America/Lima
FRONTEND_ORIGIN=https://TU-USUARIO.github.io
```

Comando de instalación:

```bash
npm install
```

Comando de inicio:

```bash
npm start
```

El servicio deberá ejecutar la carpeta `backend`.

---

# 5. Configurar GitHub Pages

En `config.js` coloca la URL pública real del backend:

```js
window.APP_CONFIG = {
  apiBaseUrl: "https://TU-BACKEND.example.com",
  timezone: "America/Lima"
};
```

Publica en GitHub Pages los archivos de la raíz:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `.nojekyll`

La carpeta `backend` puede permanecer en el mismo repositorio, pero **nunca debe contener `.env`**.

---

# 6. Funcionamiento diario

Después de terminar la configuración inicial:

1. Abres la página de GitHub Pages.
2. La página llama automáticamente al backend.
3. El backend renueva los access tokens de las dos cuentas usando sus refresh tokens.
4. Consulta Google Calendar.
5. La página muestra la semana combinada.

No tendrás que escribir las direcciones Gmail ni las contraseñas cada vez.

---

# Seguridad importante

- Nunca guardes contraseñas Gmail en GitHub.
- Nunca pongas `GOOGLE_CLIENT_SECRET` ni refresh tokens en `config.js`, `app.js` o `index.html`.
- Mantén `.env` fuera del repositorio.
- Usa HTTPS para el backend publicado.
- El frontend solo recibe los datos mínimos del evento: fecha, hora, Gmail y enlace de Meet.
- Si la URL de GitHub Pages es pública, la información presentada también puede ser visible para cualquiera que acceda a esa página. Para datos privados, añade control de acceso delante del sitio/backend.


## Datos mostrados por evento

La vista semanal muestra: fecha, hora, **título del evento**, correo Gmail de la cuenta y enlace de Google Meet cuando exista. Si Google Calendar no tiene título, se muestra **“Sin título”**.
