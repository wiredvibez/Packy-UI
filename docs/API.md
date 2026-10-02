# Packy ingest API

The Packy agent talks to this app over HTTP only. Write endpoints require header `x-packy-key` compared (SHA-256 + timing-safe equal) to env `PACKY_INGEST_KEY`.

`GET /api/shipments` and `GET /api/shipments/:id` also accept Yair’s signed session cookie (`packy_session`) from the dashboard.

Timestamps are ISO-8601 **with an explicit offset or `Z`** (`2026-10-02T08:40:00+03:00`, `2026-10-01T00:00:00Z`). A date-only value (`2026-10-02`) is stored as UTC midnight. Offset-less datetimes such as `2026-10-02T10:00:00` are rejected, so a UTC server cannot shift an Israel wall time. JSON fields are camelCase.

## Auth

```bash
# every write + optional read
-H "x-packy-key: $PACKY_INGEST_KEY"
```

Missing or wrong key → `401 { "error": "unauthorized" }`.

## Health

```bash
curl -sS https://YOUR_DOMAIN/api/health
# { "ok": true, "service": "packy" }
```

No auth.

## List shipments

`GET /api/shipments`

Query:

| param | meaning |
| --- | --- |
| `status` | Comma-separated statuses, e.g. `in_transit,customs` |
| `active` | `true` = not archived and not delivered/returned/cancelled. `false` = archived or terminal |
| `updatedSince` | ISO datetime with offset or `Z`; only rows with `updatedAt >=` this value |

```bash
curl -sS "https://YOUR_DOMAIN/api/shipments?active=true" \
  -H "x-packy-key: $PACKY_INGEST_KEY"

curl -sS "https://YOUR_DOMAIN/api/shipments?status=in_transit,customs&updatedSince=2026-10-01T00:00:00Z" \
  -H "x-packy-key: $PACKY_INGEST_KEY"
```

Response:

```json
{ "shipments": [ { "id": "...", "externalKey": "...", "title": "...", "status": "in_transit" } ] }
```

## Get one shipment

`GET /api/shipments/:id`

```bash
curl -sS "https://YOUR_DOMAIN/api/shipments/SHIPMENT_ID" \
  -H "x-packy-key: $PACKY_INGEST_KEY"
```

```json
{ "shipment": { }, "events": [ ] }
```

## Upsert (no duplicates)

`POST /api/shipments`

Keyed by stable `externalKey` (e.g. `amazon:112-123` or `dhl:JD014`). A second POST with the same key updates the existing row. Omitted fields are left intact. Send `null` to clear an optional field.

```bash
curl -sS -X POST "https://YOUR_DOMAIN/api/shipments" \
  -H "x-packy-key: $PACKY_INGEST_KEY" \
  -H "content-type: application/json" \
  -d '{
    "externalKey": "amazon:112-FAKE-0001",
    "title": "אוזניות Sony",
    "merchant": "Amazon",
    "items": [{ "name": "Sony WH-1000XM5", "qty": 1, "price": 1299 }],
    "orderNumber": "112-FAKE-0001",
    "orderDate": "2026-09-28T09:00:00+03:00",
    "carrier": "DHL",
    "trackingNumber": "JD0140000000",
    "trackingUrl": "https://www.dhl.com/il-en/home/tracking.html",
    "status": "in_transit",
    "statusDetail": "עזב את לייפציג",
    "eta": "2026-10-06T16:00:00+03:00",
    "cost": 1299,
    "currency": "ILS",
    "needsAction": false,
    "links": [
      {
        "label": "אימייל אישור",
        "url": "https://mail.google.com/mail/u/yayatete@gmail.com/#all/MESSAGE_ID",
        "kind": "email"
      },
      {
        "label": "הזמנה",
        "url": "https://www.amazon.com/gp/your-account/order-details?orderID=112-FAKE-0001",
        "kind": "order"
      }
    ],
    "sourceAccount": "yayatete@gmail.com"
  }'
```

`201` when created (`{ "shipment": {}, "created": true }`), `200` when updated (`created: false`).

## Patch by id

`PATCH /api/shipments/:id`

```bash
curl -sS -X PATCH "https://YOUR_DOMAIN/api/shipments/SHIPMENT_ID" \
  -H "x-packy-key: $PACKY_INGEST_KEY" \
  -H "content-type: application/json" \
  -d '{ "status": "out_for_delivery", "statusDetail": "אצל השליח" }'
```

## Append a tracking event

`POST /api/shipments/:id/events`

If `status` is set and `at` is at least as recent as the latest stored event, the shipment status is updated to match. An older backfilled event is stored and does not roll the status backward. The insert and the status write are one statement.

```bash
curl -sS -X POST "https://YOUR_DOMAIN/api/shipments/SHIPMENT_ID/events" \
  -H "x-packy-key: $PACKY_INGEST_KEY" \
  -H "content-type: application/json" \
  -d '{
    "at": "2026-10-02T08:40:00+03:00",
    "status": "in_transit",
    "description": "הגיע לנתב״ג",
    "location": "TLV",
    "source": "israel-post"
  }'
```

## Archive

`POST /api/shipments/:id/archive`

```bash
curl -sS -X POST "https://YOUR_DOMAIN/api/shipments/SHIPMENT_ID/archive" \
  -H "x-packy-key: $PACKY_INGEST_KEY"
```

Sets `archived: true`.

## Status enum

`ordered` · `processing` · `shipped` · `in_transit` · `customs` · `out_for_delivery` · `at_pickup_point` · `delivered` · `failed_attempt` · `exception` · `returned` · `cancelled`

## Link kinds

`email` · `order` · `tracking` · `message` · `other`

Gmail deep links should look like:

`https://mail.google.com/mail/u/yayatete@gmail.com/#all/<messageId>`

## Validation errors

`400 { "error": "validation_error", "details": { ... } }`
