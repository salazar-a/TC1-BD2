# Servicio de reservas

Servicio HTTP para registrar, consultar, actualizar y eliminar reservas. Guarda los datos en PostgreSQL y valida con Keycloak los tokens de las rutas de modificación. Docker Compose levanta los tres servicios.

## Componentes

| Servicio | Función |
| --- | --- |
| Aplicación | API en Node.js y Express, escrita en TypeScript. |
| PostgreSQL | Almacena las reservas en un volumen persistente. |
| Keycloak | Emite los tokens y proporciona las llaves públicas para validarlos. |

## Requisitos

Docker con Compose. Node.js 22 y npm para ejecutar las pruebas fuera de los contenedores. Con la configuración de ejemplo deben estar disponibles los puertos locales 3000, 5432 y 8080.

## Configuración

`.env.example` reúne los valores de ejemplo. Compose usa la copia `.env`, que queda fuera de Git.

| Variables | Uso |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | Base de datos, credenciales y puerto publicado de PostgreSQL. |
| `KC_BOOTSTRAP_ADMIN_USERNAME`, `KC_BOOTSTRAP_ADMIN_PASSWORD` | Cuenta administradora de Keycloak. |
| `KEYCLOAK_CLIENT_SECRET` | Se inyecta en el client `reservations-test` al importar el realm. |
| `OIDC_ISSUER`, `OIDC_AUDIENCE` | Emisor y audiencia exigidos al validar los tokens. |

Dentro de Compose, la aplicación conecta con `postgres` y `keycloak` por sus nombres de servicio. Las direcciones internas se definen en `docker-compose.yml`.

## Arranque

Desde la raíz del repositorio:

```sh
cp .env.example .env
docker compose up --build -d --wait
```

La API queda en `http://localhost:3000` y Keycloak en `http://localhost:8080` con los puertos del ejemplo. PostgreSQL crea la tabla de reservas al inicializar su volumen. Compose espera a que PostgreSQL y Keycloak estén saludables antes de iniciar la aplicación, para evitar conexiones prematuras. `--wait` termina cuando los servicios están saludables.

## Autenticación

Las rutas de lectura, salud y disponibilidad son públicas. Crear, actualizar y eliminar requieren un token de acceso de Keycloak con el rol `reservation_writer`. El realm `reservations` y el client `reservations-test` se importan al iniciar Keycloak.

`keycloak/reservations-realm.json` contiene solo la configuración necesaria para esta API: el rol, el cliente con su audiencia y la cuenta de servicio con el rol asignado. Keycloak crea el resto de su configuración predeterminada al importar el realm. El secreto del cliente se toma de `KEYCLOAK_CLIENT_SECRET`.

Con los valores de `.env.example`, se solicita un token al cliente importado:

```sh
curl --request POST \
  http://localhost:8080/realms/reservations/protocol/openid-connect/token \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=reservations-test" \
  --data-urlencode "client_secret=replace_with_local_client_secret"
```

La respuesta contiene `access_token`. En las rutas protegidas, se envía como `Authorization: Bearer <access_token>`.

## Contrato HTTP

La reserva tiene estos campos:

| Campo | Tipo en JSON | En POST y PUT | En la respuesta |
| --- | --- | --- | --- |
| `id` | Número entero | No se envía | Sí, asignado por PostgreSQL. |
| `clientName` | Texto | Obligatorio | Sí. |
| `date` | Texto | Obligatorio | Sí. |
| `peopleAmount` | Número entero | Obligatorio | Sí. |

Ejemplo de cuerpo para POST y PUT:

```json
{
  "clientName": "Ana",
  "date": "2099-01-01",
  "peopleAmount": 2
}
```

Los campos tienen estas restricciones:

- `clientName` debe ser texto no vacío. Se eliminan los espacios al inicio y al final.
- `date` debe ser una fecha de calendario en formato `YYYY-MM-DD`, igual o posterior al día actual en Costa Rica.
- `peopleAmount` debe ser un entero positivo.
- El filtro `?date` acepta cualquier fecha válida de calendario en ese formato.
- El `id` de la ruta debe ser un entero positivo seguro.

| Método | Ruta | Acceso | Entrada | Respuesta esperada |
| --- | --- | --- | --- | --- |
| GET | `/health` | Público | Sin cuerpo | 200, `{"status":"ok"}`. No consulta PostgreSQL. |
| GET | `/ready` | Público | Sin cuerpo | 200, `{"status":"ready"}` si PostgreSQL responde, o 503, `{"status":"not_ready"}` si no responde. |
| GET | `/reservations` | Público | Filtro opcional `?date=YYYY-MM-DD` | 200, arreglo de reservas ordenado por `id`. |
| GET | `/reservations/:id` | Público | `id` en la ruta | 200, reserva solicitada, o 404 si no existe. |
| POST | `/reservations` | `reservation_writer` | JSON de reserva sin `id` | 201, reserva creada con `id`. |
| PUT | `/reservations/:id` | `reservation_writer` | `id` y JSON de reserva sin `id` | 200, reserva actualizada, o 404 si no existe. |
| DELETE | `/reservations/:id` | `reservation_writer` | `id` en la ruta | 204, sin cuerpo, o 404 si no existe. |

Las entradas inválidas devuelven 400. Las rutas protegidas devuelven 401 sin un token válido y 403 si el token no tiene el rol requerido. Los errores de estas rutas se devuelven como JSON con un campo `error` de tipo texto.

## Pruebas

Con la pila de Compose en ejecución y un `.env` local configurado:

```sh
npm ci
npm test
```

Las pruebas de integración detienen temporalmente PostgreSQL y reinician los contenedores.

Para comprobar específicamente el archivo de importación con volúmenes nuevos, se puede usar un proyecto Compose temporal. Si la pila habitual está ocupando los mismos puertos, deténgala primero con `docker compose stop`. Desde la raíz del repositorio:

```sh
COMPOSE_PROJECT_NAME=realm-check docker compose up --build -d --wait
COMPOSE_PROJECT_NAME=realm-check npm test
COMPOSE_PROJECT_NAME=realm-check docker compose down -v
```

El primer comando importa el realm en un volumen nuevo. Las pruebas comprueban la emisión del token, su audiencia y el rol al crear una reserva; también prueban acceso denegado, operaciones de reservas y persistencia. El último comando elimina solo los contenedores y volúmenes del proyecto temporal. Si se detuvo la pila habitual, se puede reanudar con `docker compose up -d --wait`.

Keycloak omite la importación al arrancar cuando el realm ya existe en su volumen. Por eso, editar el JSON no cambia un realm importado anteriormente; la prueba con `realm-check` verifica la nueva configuración sin borrar las reservas ni la configuración de la pila habitual.

## Persistencia

PostgreSQL guarda la base en el volumen `postgres_data`, montado en `/var/lib/postgresql/data`. El script de `sql/` crea la tabla cuando se inicializa un volumen vacío. `docker compose down` elimina los contenedores, pero conserva ese volumen. Al volver a levantar PostgreSQL se montan los mismos datos. Keycloak conserva su configuración en `keycloak_data`.

Para comprobarlo, se obtiene un token como se indicó en Autenticación, se crea una reserva y se anota el `id` que devuelve el POST:

```sh
curl --request POST \
  http://localhost:3000/reservations \
  --header "Authorization: Bearer <access_token>" \
  --header "Content-Type: application/json" \
  --data '{"clientName":"Ana","date":"2099-01-01","peopleAmount":2}'
```

Luego se eliminan los contenedores sin borrar los volúmenes, se levanta de nuevo el sistema y se consulta la reserva creada. En la última URL, `<id>` se sustituye por el valor recibido en el POST.

```sh
docker compose down
docker compose up -d --wait
curl "http://localhost:3000/reservations/<id>"
```

El GET debe responder 200 con la misma reserva y el mismo `id`.

## Apagado

```sh
docker compose down
```

Este comando detiene y elimina los contenedores, pero mantiene los volúmenes para el siguiente arranque.

## Decisiones de contenedorización

| Decisión | Motivo |
| --- | --- |
| Imagen oficial `node:22-alpine` en dos etapas | La base Alpine mantiene pequeña la imagen. La primera etapa instala las herramientas de compilación y genera `dist`. La segunda usa `npm ci --omit=dev`, copia `dist` desde la primera etapa y ejecuta la API como usuario `node`. |
| Imágenes `postgres:17` y `quay.io/keycloak/keycloak:26.7.4` | Se usan las imágenes oficiales con etiquetas concretas en vez de `latest`. |
| Puertos publicados en `127.0.0.1` | La API, PostgreSQL y Keycloak quedan accesibles desde la máquina local sin exponer esos puertos en todas sus interfaces de red. |

## Uso de IA

Durante el proyecto recurrimos a herramientas de IA para aclarar dudas técnicas e identificar aspectos que convenía revisar. El grupo evaluó esas sugerencias y comprobó por su cuenta los comandos, las configuraciones y los cambios que finalmente incluyó en el repositorio.
