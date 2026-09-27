# FinClaro 1.0 Backend

Backend inicial de FinClaro.

## Estado actual

- API HTTP
- PostgreSQL
- CRUD de usuarios y eventos
- Parser de lenguaje natural conectado a OpenAI Responses API
- Structured Outputs con JSON Schema
- Modelo configurable mediante `OPENAI_MODEL` (por defecto: `gpt-5.6-luna`)
- Clave API exclusivamente en variable de entorno

## Parser

Ejemplos de mensajes que el parser debe entender:

- "El viernes a las 18 tengo que llevar el coche al taller"
- "Recuérdame mañana a las 9 llamar al médico"
- "¿Qué tengo esta semana?"
- "Cancela el médico del jueves"
- "Cambia el dentista a las 19"

El parser solo interpreta el mensaje. No escribe directamente en la base de datos.

## Variables

`OPENAI_API_KEY` — clave de la API de OpenAI.

`OPENAI_MODEL` — opcional. Por defecto `gpt-5.6-luna`.

`FINCLARO_AI_TEST_ENDPOINT=true` y `FINCLARO_INTERNAL_TOKEN` habilitan temporalmente el endpoint protegido `POST /ai/parse` para pruebas.

## Arquitectura siguiente

1. parser de lenguaje natural;
2. router seguro;
3. resolución de eventos;
4. creación/edición/cancelación;
5. programacion de recordatorios;
6. webhook y conversacion por WhatsApp (fase de pruebas);
7. entrega de recordatorios por WhatsApp con plantillas aprobadas;
8. autenticacion real y control de permisos.

## Pruebas

Ejecuta npm test desde backend para probar la verificacion del webhook y la deduplicacion de mensajes.

## WhatsApp Cloud API (fase de pruebas)

El endpoint `GET/POST /webhooks/whatsapp` verifica la suscripción de Meta, comprueba la firma `X-Hub-Signature-256`, deduplica los mensajes entrantes y los procesa en segundo plano. Las respuestas de texto se envían mediante Cloud API. Los números deben estar vinculados previamente a un usuario; los números desconocidos se ignoran.

Configura en Railway, sin guardar secretos en Git:

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_API_VERSION` (formato `vNN.N`)
- `FINCLARO_INTERNAL_TOKEN`
- `FINCLARO_PRIVACY_URL`

Las rutas de usuarios, eventos, diagnósticos de base de datos y administración requieren `X-FinClaro-Internal-Token`. Nunca expongas ese token en JavaScript del navegador. Para enlazar el número de prueba, crea primero el usuario con `POST /users` y luego llama a `POST /internal/whatsapp/contacts` con `{ "user_id": "...", "wa_id": "..." }`, usando la misma cabecera interna. El usuario debe responder `ACEPTO` para activar el chat; puede escribir `BAJA` para desactivarlo.

Antes de invitar usuarios reales, actualiza la política de privacidad para explicar el tratamiento del número y los mensajes, los proveedores que los procesan y los plazos de conservación. Los recordatorios programados siguen sin tener un proveedor de entrega conectado y requieren una plantilla aprobada si se envían fuera de la ventana de atención de WhatsApp.
