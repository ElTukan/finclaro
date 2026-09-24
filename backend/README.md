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
5. recordatorios;
6. WhatsApp Business;
7. autenticación real y control de permisos.
