# Apply Progress: boton-cambios-devoluciones (PR1 — extension-only)

## Status
- Change: `boton-cambios-devoluciones`
- Work unit: PR1 — `extensions/customer-account-order-actions/**` scope only
- Attempt: token `sha256:49b67d69...` (state: proceed on apply; settled `failed` after subagent timeout — files written correctly, validation evidence incomplete at timeout; orchestrator completed validation inline)

## PR1 implementation (DONE)

| File | State |
|---|---|
| `extensions/customer-account-order-actions/src/PostventaEntrypoint.jsx` | ✅ NEW — shared gated component (D3 evaluate, fail-closed, i18n label, extension://?orderId= href) |
| `extensions/customer-account-order-actions/src/OrderStatusPostventa.jsx` | ✅ NEW — target module `customer-account.order-status.cart-line-list.render-after` |
| `extensions/customer-account-order-actions/src/PostventaNoop.jsx` | ✅ NEW — fail-closed module (index + action-menu targets) |
| `extensions/customer-account-order-actions/shopify.d.ts` | ✅ Updated — declare modules for the 3 new modules with per-target APIs |
| `extensions/customer-account-order-actions/shopify.extension.toml` | ✅ Updated — cart-line-list target + targeting-scoped metafields request (`crystal`/`cambios_devoluciones_ticket`), index + action-menu targets → Noop |
| `extensions/customer-account-order-actions/src/OrderActionMenuItem.jsx` | ✅ Deleted (replaced) |
| `extensions/customer-account-order-actions/locales/en.default.json` | ✅ NEW — `{"entrypoint": {"action": "Returns and exchanges"}}` |
| `extensions/customer-account-order-actions/locales/es.json` | ✅ NEW — `{"entrypoint": {"action": "Cambios y devoluciones"}}` |

Not touched (per PR1 scope): `shopify.app.toml`, `customer-account-order-full-page/**`, spec/design/tasks docs.

## Validation evidence

| Check | Command | Result |
|---|---|---|
| Shopify component validation (OrderStatusPostventa) | skill validate.mjs --target customer-account.order-status.cart-line-list.render-after --version 2026-07 --file ./src/OrderStatusPostventa.jsx | ✅ VALID (PostventaEntrypoint noted non-Shopify, expected) |
| Shopify component validation (PostventaEntrypoint) | same + --file ./src/PostventaEntrypoint.jsx | ✅ VALID — `s-button` recognized |
| Shopify component validation (PostventaNoop) | same + --file ./src/PostventaNoop.jsx | ✅ VALID |
| Extension build | `pnpm build` (workspace root) | ✅ PASS — customer-account-order-actions 21.7 KB, exit 0 |
| tsc --noEmit | npx tsc (extension) | ⚠️ N/A — typescript not installed in repo (no repo lint/typecheck scripts; AGENTS.md documents runtime validation as the reliable path). JSX typing covered by skill validator + shopify.d.ts |

## Deferred to PR2 (user decision: two PRs)
- Dev-store visible-button validation (deliveryState/requestInProgress scenarios, locale switching, i18n hydration at the target)
- Confirmation of Monitor metafield VALUE SHAPE (open item #1b) and seeding the dev-store record with the frozen key/shape
- Any `shopify.app.toml` change only if #1b reveals one is needed (merchant-owned namespace: expected none)
- Release-note communication (placement change: action menu → below order lines)