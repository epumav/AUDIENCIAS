# Calendario semanal de dos cuentas Gmail — Versión 4

Esta versión deja mucho más clara la configuración de las dos cuentas Gmail.

La página muestra, para cada evento de la semana:

- fecha;
- hora de inicio y fin;
- **título del evento**;
- correo Gmail al que pertenece;
- enlace de Google Meet, cuando existe.

## Importante sobre las contraseñas

**No escribas las contraseñas de Gmail en ningún archivo del proyecto.**

Las contraseñas se usan solamente en la página oficial de Google durante la autorización inicial. El proyecto guarda un `refresh token`, que permite consultar el calendario posteriormente sin volver a pedir la contraseña.

---

# 1. Archivo donde se escriben los dos correos

Entra a la carpeta:

```text
backend
```

Copia:

```text
.env.example
```

como:

```text
.env
```

Abre `backend/.env` y completa:

```env
GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET

CORREO_1=primeracorreo@gmail.com
REFRESH_TOKEN_1=

CORREO_2=segundacorreo@gmail.com
REFRESH_TOKEN_2=

TIMEZONE=America/Lima
PORT=3000
FRONTEND_ORIGIN=https://TU-USUARIO.github.io
```

Los correos se escriben directamente en:

```env
CORREO_1=primeracorreo@gmail.com
CORREO_2=segundacorreo@gmail.com
```

**No existe ningún campo para contraseña.**

---

# 2. Configurar Google Cloud

1. Crea o selecciona un proyecto en Google Cloud.
2. Habilita **Google Calendar API**.
3. Configura la pantalla de consentimiento OAuth.
4. Crea un **OAuth Client ID** de tipo **Web application**.
5. Agrega esta URI como Authorized redirect URI:

```text
http://localhost:53682/oauth2callback
```

6. Si la aplicación está en modo de prueba, agrega las dos cuentas Gmail como usuarios de prueba.
7. Copia el Client ID y Client Secret al archivo `backend/.env`.

---

# 3. Instalar el backend

Necesitas Node.js 20 o superior.

Abre una terminal dentro de `backend` y ejecuta:

```bash
npm install
```

---

# 4. Autorizar la cuenta 1

Asegúrate de haber escrito primero:

```env
CORREO_1=primeracorreo@gmail.com
```

Después ejecuta:

```bash
npm run setup -- 1
```

El programa abrirá el flujo oficial de Google e intentará usar el correo indicado en `CORREO_1`.

Al finalizar mostrará algo parecido a:

```env
REFRESH_TOKEN_1=1//xxxxxxxxxxxxxxxx
```

Copia esa línea al archivo `.env`.

---

# 5. Autorizar la cuenta 2

Asegúrate de haber escrito:

```env
CORREO_2=segundacorreo@gmail.com
```

Ejecuta:

```bash
npm run setup -- 2
```

Después copia el resultado:

```env
REFRESH_TOKEN_2=1//xxxxxxxxxxxxxxxx
```

al archivo `.env`.

---

# 6. Resultado final del archivo .env

Quedará aproximadamente así:

```env
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx

CORREO_1=primeracorreo@gmail.com
REFRESH_TOKEN_1=1//xxxxxxxxxxxxxxxx

CORREO_2=segundacorreo@gmail.com
REFRESH_TOKEN_2=1//xxxxxxxxxxxxxxxx

TIMEZONE=America/Lima
PORT=3000
FRONTEND_ORIGIN=https://TU-USUARIO.github.io
```

No agregues las contraseñas Gmail.

---

# 7. Probar el backend

Desde `backend` ejecuta:

```bash
npm start
```

El backend utilizará normalmente:

```text
http://localhost:3000
```

Puedes comprobarlo con:

```text
http://localhost:3000/health
```

---

# 8. Configurar el frontend

En `config.js` escribe la URL pública de tu backend:

```js
window.APP_CONFIG = {
  apiBaseUrl: "https://TU-BACKEND.example.com",
  timezone: "America/Lima"
};
```

La página GitHub Pages consulta ese backend automáticamente.

---

# 9. Datos mostrados

Cada evento muestra:

```text
Fecha | Hora | Título del evento | Correo Gmail | Google Meet
```

Si el evento no tiene título se muestra:

```text
Sin título
```

Si no tiene Google Meet se indica que no existe enlace Meet.

---

# 10. Seguridad

El archivo `.gitignore` ya excluye:

```text
.env
node_modules/
```

Nunca publiques en GitHub:

- `GOOGLE_CLIENT_SECRET`;
- `REFRESH_TOKEN_1`;
- `REFRESH_TOKEN_2`;
- contraseñas Gmail.

Los correos pueden quedar configurados en las variables del backend, pero los tokens deben permanecer privados.
