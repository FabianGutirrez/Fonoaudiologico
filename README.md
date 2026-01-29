
# Transcriptor Fonoaudiológico AI

Esta es una aplicación web para transcribir grabaciones de audio y video con "Fidelidad Radical" utilizando la API de Google Gemini. Está diseñada para fonoaudiólogos y lingüistas clínicos.

## Arquitectura para Producción

Esta versión del proyecto está lista para ser desplegada en la web de forma segura. La arquitectura separa el **Frontend** (lo que el usuario ve en el navegador) del **Backend** (donde se maneja la lógica segura).

- **Frontend**: La aplicación React que creaste. Se encuentra en la raíz del proyecto.
- **Backend**: Una "función sin servidor" (serverless function) ubicada en la carpeta `/api`. Esta función es un intermediario seguro que protege tu clave de API de Gemini.

El flujo es el siguiente:
1. El usuario sube un archivo en el Frontend.
2. El Frontend envía el archivo a nuestra propia API en `/api/transcribe`.
3. El Backend en `/api/transcribe` recibe el archivo, adjunta la clave de API secreta (que lee de las variables de entorno del servidor) y llama a la API de Gemini.
4. El Backend devuelve el resultado de la transcripción al Frontend.
5. El Frontend muestra el resultado al usuario.

¡De esta forma, la `API_KEY` **nunca** se expone en el navegador!

---

## Cómo Desplegar en la Web (Usando Vercel)

Vercel es una plataforma de hosting gratuita y muy fácil de usar, ideal para este proyecto.

### Paso 1: Sube tu Proyecto a GitHub

1.  Crea una cuenta en [GitHub](https://github.com/) si aún no tienes una.
2.  Crea un nuevo repositorio.
3.  Sube todos los archivos de este proyecto a tu nuevo repositorio de GitHub.

### Paso 2: Crea una Cuenta en Vercel y Conecta tu Proyecto

1.  Crea una cuenta gratuita en [Vercel](https://vercel.com/signup) usando tu cuenta de GitHub.
2.  Desde tu panel de control de Vercel, haz clic en **"Add New... > Project"**.
3.  Busca y selecciona el repositorio de GitHub que acabas de crear. Vercel detectará automáticamente que es un proyecto de React/Vite.
4.  No cambies ninguna configuración de construcción ("Build & Development Settings"), Vercel lo manejará todo.

### Paso 3: Configura tu Clave de API (¡El Paso Más Importante!)

1.  Antes de desplegar, despliega la sección **"Environment Variables"** (Variables de Entorno).
2.  Crea una nueva variable:
    -   **Name**: `API_KEY`
    -   **Value**: Pega aquí tu clave secreta de la API de Google Gemini.
3.  Asegúrate de que la variable **NO** esté marcada como "Exposed to the browser". Debe ser secreta y solo accesible para el backend.
4.  Haz clic en **"Add"**.

### Paso 4: Despliega

1.  Haz clic en el botón **"Deploy"**.
2.  Vercel construirá tu aplicación, configurará la función de backend en `/api/transcribe` y la desplegará en la web.
3.  ¡Y listo! En un par de minutos, Vercel te dará una URL pública (ej: `https-tu-proyecto.vercel.app`) donde tu aplicación estará funcionando en vivo.

¡Felicidades, tu aplicación ya está en la web de forma segura y profesional!
