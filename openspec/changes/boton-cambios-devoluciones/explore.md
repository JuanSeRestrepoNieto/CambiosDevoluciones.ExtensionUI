# Exploration: boton-cambios-devoluciones

## Summary
The proposal is **largely feasible** but contains specific inaccuracies in target names and data-access assumptions that must be corrected before implementation.

## Current State

### Extension: `customer-account-order-actions/`
- **Target**: `customer-account.order.action.menu-item.render` (single target)
- **Behavior**: Always renders a "Cambios y devoluciones" button. Uses `shopify.orderId` to build an `extension://` link. No fulfillment/delivery status logic exists — it renders unconditionally (disabled fallback only when orderId is missing).
- **API version**: `2026-07`, dependencies `@shopify/ui-extensions ~2026.7.0`, Preact-based.

### Extension: `customer-account-order-full-page/`
- **Target**: `customer-account.order.page.render`
- **Behavior**: Already handles incoming orderId via two sources: `shopify.order?.value?.id` (target-provided) and URL search params (`?orderId=`). Displays order context or a critical banner if no order resolved. This is ready to receive navigation from the action extension.
- **API version**: `2026-07`, same dependencies.

## Proposal Accuracy Assessment

### ✅ Accurate
1. **Affected areas** — Correctly identifies both extensions as the modification targets.
2. **Navigation pattern** — The `extension://` href with orderId param already works and the full-page extension already handles it.
3. **Scope boundaries** — Correctly scopes out backend/ERP integration.
4. **Success criteria** — Reasonable and testable.

### ⚠️ Inaccurate or Uncertain

#### 1. Target name `customer-account.order-status.action.render` does NOT exist
The proposal references this target. Per the Shopify skill doc (version 2026-01 baseline), valid order-action targets are:
- `customer-account.order.action.menu-item.render` ✅ (already in use)
- `customer-account.order.action.render` ✅ (exists, not yet used)

There is no `customer-account.order-status.action.render`. The proposal should use `customer-account.order.action.render` for the order-detail action surface, or one of the `customer-account.order-status.block.render` / `customer-account.order-status.*.render-after` targets for inline rendering.

#### 2. Hook names `useOrder`, `useFulfillments` are not the actual API
The codebase uses the `shopify` global object (e.g., `shopify.orderId`, `shopify.order?.value?.id`, `shopify.navigation`). The extension framework for Preact does not expose React-style hooks. The proposal should reference the `shopify` global API instead.

#### 3. Fulfillment data availability at `order-index.block.render` is uncertain
The Shopify skill doc lists the "Order Status API" (with Order, Fulfillments, etc.) specifically for order-status targets. At the order-index target, per-order fulfillment data may not be directly available via `shopify.order` — this is likely a list-level target without individual order context. **This is the biggest risk**: the proposal assumes fulfillment data is available at the index target but this needs verification.

#### 4. `customer-account.order-index.block.render` context
This target renders a block on the order index page. It is unclear whether it receives per-order context (orderId, fulfillment status) or renders once for the entire list. If it renders once (page-level), showing per-order conditional buttons from this target is architecturally impossible.

## Feasibility Assessment

| Aspect | Feasibility | Notes |
|--------|-------------|-------|
| Order detail action button (menu item) | **High** | Already works. Only needs delivery-status gating. |
| Order detail action button (inline) | **High** | `customer-account.order.action.render` is a valid alternative. |
| Order index conditional button | **Medium-Low** | Target exists but per-order fulfillment data access is uncertain. Needs API investigation. |
| Full-page order ID handling | **Already done** | No changes needed. |
| Delivery status evaluation | **Medium** | Need to confirm what order/fulfillment data the `shopify` global exposes at each target. May require Customer Account API GraphQL query. |

## Recommended Corrections to Proposal

1. **Replace** `customer-account.order-status.action.render` with `customer-account.order.action.render` (or a valid order-status block target).
2. **Replace** hook references (`useOrder`, `useFulfillments`) with `shopify` global API references and/or Customer Account API GraphQL queries.
3. **Add a spike task** to verify what order context and fulfillment data is available at `customer-account.order-index.block.render` — this may require a different approach (e.g., querying via Customer Account API GraphQL).
4. **Consider phasing**: Phase 1 = order-detail action with delivery gating (high confidence); Phase 2 = order-index entrypoint (needs investigation).

## Effort Estimate
- **Phase 1 (order detail gating)**: Small — ~2-4 hours. Add fulfillment status check to existing action extension, conditional rendering.
- **Phase 2 (order index entrypoint)**: Medium — ~4-8 hours. Requires API investigation, possibly new targeting entry, and different data-fetching approach.
