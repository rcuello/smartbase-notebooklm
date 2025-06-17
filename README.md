# SmartBase: La alternativa de código abierto a NotebookLM

[![Licencia: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ¿Y si el poder de una herramienta como NotebookLM no estuviera encerrado en un sistema cerrado?  
> ¿Y si pudieras construir una alternativa privada, autoalojada y personalizada para las necesidades de tu negocio, sin escribir ni una sola línea de código?

Eso es exactamente lo que hicimos con **SmartBase**: una potente herramienta de investigación con IA basada en tus propios documentos, totalmente bajo tu control.

---

## 🔍 Acerca del proyecto

NotebookLM es una de las herramientas de investigación con IA más potentes hoy en día. Sin embargo, al ser cerrada, no permite personalización ni alojamiento privado. **SmartBase** fue creado para resolver ese problema.

No es un simple prototipo. Es una aplicación robusta, extensible y construida con herramientas modernas como  [Supabase](https://supabase.com/) y [n8n](https://n8n.io/). Nuestro objetivo es democratizar el acceso a la IA documental con una solución 100% open source.

---

## ✨ Funcionalidades clave

- 🧠 **Chatea con tus documentos:** Sube documentos y obtén respuestas contextualizadas.
- 📎 **Citas verificables:** Cada respuesta incluye referencias directas a la fuente.
- 🎙️ **Generación de podcasts:** Crea resúmenes de audio o conversaciones simuladas.
- 🔐 **Autoalojado y privado:** Tú controlas toda la infraestructura y los datos.
- 🧩 **Personalizable y extensible:** Compatible con herramientas no-code como n8n y Supabase.


---

## 🛠️ Tecnologías utilizadas

**Frontend:**
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

**Backend:**
- [Supabase](https://supabase.com/) – Base de datos, autenticación y almacenamiento
- [n8n](https://n8n.io/) – Automatización y lógica backend

---

## 🚀 Guía rápida de instalación

Esta guía te permite desplegar SmartBase fácilmente.


### 1. Crea un proyecto en Supabase
- Ve a [supabase.com](https://supabase.com/)
- Crea un nuevo proyecto y guarda la contraseña de la base de datos

### 2. Clona la plantilla del repositorio
- Ve a Repositorio SmartBase en GitHub
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

