<p align="center">
  <img src="https://www.theaiautomators.com/wp-content/uploads/2025/06/Group-2651.svg" alt="Logo SmartBase" width="600"/>
</p>

# SmartBase: La alternativa de código abierto a NotebookLM

[![Licencia: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Estrellas en GitHub](https://img.shields.io/github/stars/theaiautomators/smartbase-notebooklm?style=social)](https://github.com/theaiautomators/smartbase-notebooklm/stargazers)
[![YouTube Video](https://img.shields.io/badge/YouTube-Ver%20la%20Demo-red)](https://www.youtube.com/watch?v=IXJEGjfZRBE)

> ¿Y si el poder de una herramienta como NotebookLM no estuviera encerrado en un sistema cerrado?  
> ¿Y si pudieras construir una alternativa privada, autoalojada y personalizada para las necesidades de tu negocio, sin escribir ni una sola línea de código?

Eso es exactamente lo que hicimos con **SmartBase**: una potente herramienta de investigación con IA basada en tus propios documentos, totalmente bajo tu control.

---

## 🔍 Acerca del proyecto

NotebookLM es una de las herramientas de investigación con IA más potentes hoy en día. Sin embargo, al ser cerrada, no permite personalización ni alojamiento privado. **SmartBase** fue creado para resolver ese problema.

No es un simple prototipo. Es una aplicación robusta, extensible y construida con herramientas modernas como [Loveable](https://theaiautomators.com/go/loveable), [Supabase](https://supabase.com/) y [n8n](https://theaiautomators.com/go/n8n). Nuestro objetivo es democratizar el acceso a la IA documental con una solución 100% open source.

<p align="center">
  <img src="https://www.theaiautomators.com/wp-content/uploads/2024/04/TAIA-Logo-S2.png" alt="Logo AI Automators" width="500"/>
</p>

---

## 👥 Únete a nuestra comunidad

¿Quieres aprender a personalizar SmartBase o crear herramientas similares?  
Únete a nuestra comunidad en:

👉 [**The AI Automators**](https://www.theaiautomators.com/)

---

## ✨ Funcionalidades clave

- 🧠 **Chatea con tus documentos:** Sube documentos y obtén respuestas contextualizadas.
- 📎 **Citas verificables:** Cada respuesta incluye referencias directas a la fuente.
- 🎙️ **Generación de podcasts:** Crea resúmenes de audio o conversaciones simuladas.
- 🔐 **Autoalojado y privado:** Tú controlas toda la infraestructura y los datos.
- 🧩 **Personalizable y extensible:** Compatible con herramientas no-code como n8n y Supabase.

---

## 📺 Demo y recorrido

Mira la demo completa y el tutorial paso a paso en YouTube:  
[![Ver en YouTube](https://img.shields.io/badge/YouTube-Ver%20Ahora-red)](https://www.youtube.com/watch?v=IXJEGjfZRBE)

<p>
  <a target="_blank" href="https://www.youtube.com/watch?v=IXJEGjfZRBE"><img src="https://raw.githubusercontent.com/theaiautomators/smartbase-notebooklm/main/public/video.png" alt="Video" width="500"/></a>
</p>

---

## 🛠️ Tecnologías utilizadas

**Frontend:**
- [Loveable](https://theaiautomators.com/go/loveable)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

**Backend:**
- [Supabase](https://supabase.com/) – Base de datos, autenticación y almacenamiento
- [n8n](https://theaiautomators.com/go/n8n) – Automatización y lógica backend

---

## 🚀 Guía rápida de instalación

Esta guía te permite desplegar SmartBase fácilmente, sin necesidad de programar.

📽️ Sigue el tutorial desde este minuto: [17:53 - Paso a paso](https://youtu.be/IXJEGjfZRBE?t=1073)

### 1. Crea un proyecto en Supabase
- Ve a [supabase.com](https://supabase.com/)
- Crea un nuevo proyecto y guarda la contraseña de la base de datos

### 2. Clona la plantilla del repositorio
- Ve a [Repositorio SmartBase en GitHub](https://github.com/theaiautomators/smartbase-notebooklm)
- Haz clic en **Use this template** para crear tu propia copia

### 3. Importa el repositorio en [Bolt.new](https://bolt.new/)
- Regístrate, conecta tu cuenta de GitHub e importa tu repositorio
- Conecta tu proyecto de Supabase
- Las funciones Edge se desplegarán automáticamente

### 4. Importa los flujos de trabajo de n8n
- Usa `/n8n/Import_SmartBase_Workflows.json` para importar todos los flujos  
  O bien importa los JSON uno por uno y configura sus credenciales

### 5. Añade secretos en Supabase
Ve a `Edge Functions > Secrets` y añade:

```

NOTEBOOK\_CHAT\_URL
NOTEBOOK\_GENERATION\_URL
AUDIO\_GENERATION\_WEBHOOK\_URL
DOCUMENT\_PROCESSING\_WEBHOOK\_URL
ADDITIONAL\_SOURCES\_WEBHOOK\_URL
NOTEBOOK\_GENERATION\_AUTH
OPENAI\_API\_KEY

```

### 6. ¡Prueba y personaliza!
¡Listo! Tu instancia de SmartBase está activa.  
Sube documentos, empieza a chatear y personaliza todo desde Bolt o Supabase.


---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT.

---

## ⚠️ Nota sobre la licencia de n8n

n8n **no es completamente open source** en el sentido tradicional.  
Si planeas usar SmartBase como un servicio comercial (por ejemplo, SaaS público), deberías revisar su [licencia de uso sostenible](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).

💡 Alternativa: Puedes reemplazar flujos de n8n con funciones Edge en Supabase para tener una solución 100% open source.

