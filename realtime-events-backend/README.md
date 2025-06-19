# 📡 Realtime Events Backend

Microservicio backend para manejar eventos en tiempo real en la aplicación `smartbase-notebooklm`. Diseñado para desacoplar el sistema de Supabase y permitir una arquitectura orientada a eventos utilizando WebSockets + RabbitMQ.

---

## 🚀 Características

- ✅ Emisión de eventos en tiempo real vía WebSocket.
- ✅ Suscripción a eventos desde RabbitMQ.
- ✅ Integración sencilla con frontends React u otros clientes WebSocket.
- ✅ Preparado para funcionar con cualquier origen de eventos (PostgreSQL, MongoDB, etc.).
- ✅ Listo para escalar horizontalmente en arquitecturas distribuidas.

---

## 📁 Estructura del proyecto

```

realtime-events-backend/
├── src/
│   ├── index.ts                  # Punto de entrada principal (WebSocket + Express)
│   ├── services/
│   │   ├── rabbitmq.service.ts   # Conexión y consumo de eventos de RabbitMQ
│   │   └── event.service.ts      # Lógica para emitir eventos al cliente
├── .env.example                  # Variables de entorno
├── Dockerfile                    # Imagen para Docker
├── docker-compose.yml            # Orquestación junto con RabbitMQ
├── package.json
└── tsconfig.json

````

---

## 🛠️ Requisitos

- Node.js v18+
- Docker + Docker Compose
- Cliente WebSocket para consumir los eventos (puede ser React, HTML, etc.)

---

## ⚙️ Configuración

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-org/realtime-events-backend.git
cd realtime-events-backend
````

2. Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

3. Iniciar todo el stack con Docker:

```bash
docker-compose up --build
```

Esto levantará:

* 🧠 `realtime-backend` en `http://localhost:4001`
* 🐰 `RabbitMQ` en `http://localhost:15672` (usuario: `guest`, pass: `guest`)

---

## 🔄 Enviar un evento de prueba

Puedes usar `curl` o Postman para enviar un evento:

```bash
curl -X POST http://localhost:4001/events \
  -H "Content-Type: application/json" \
  -d '{"type": "NOTEBOOK_CREATED", "title": "Mi nueva nota"}'
```

Este evento se emitirá a todos los clientes WebSocket conectados.

---

## 🧪 Cliente de prueba

Puedes probarlo con el archivo HTML incluido en `frontend/ws-client.html`:

```bash
open frontend/ws-client.html
```

---

## 📦 Producción

Recomendaciones:

* Usar PM2 o Docker Swarm/Kubernetes para orquestación.
* Proteger el WebSocket con autenticación (JWT, API Gateway, etc.).
* Configurar conexión segura con RabbitMQ en producción.

---

## 📄 Licencia

MIT © 2025 - smartbase-notebooklm contributors

