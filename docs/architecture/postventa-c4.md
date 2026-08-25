# Postventa C4 (Lean)

## System boundary

- Shopify Customer Account extension is the capture and tracking UI.
- Monitor Omnicanal is the orchestration layer for post-sale lifecycle.
- Enterprise systems (SAP, Wompi, CEGID, logistics) stay behind Monitor.

## Container view

1. Customer Account extension (UI, wizard, validation states).
2. Shopify APIs (customer/order context, scoped data access).
3. Monitor API (eligibility, request creation, status tracking).
4. Enterprise systems (indirect only through Monitor).

## Responsibility split

- Extension: collect intent, guide user, submit request, show status.
- Monitor: execute workflow, route integrations, enforce enterprise process.

## Invariants

- Extension does not orchestrate enterprise process.
- Order id alone is not authorization.
- No direct extension integration with enterprise systems.
