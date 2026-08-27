# Proposal: Boton Cambios y Devoluciones en Customer Account

## Intent
Enable customers to initiate post-sale requests (returns, exchanges, warranty) directly from the Customer Account interface by exposing a dedicated action button on both the order list and order detail views. The button is enabled when the order has been successfully delivered; it appears disabled when a post-sale request is already in progress for that order.

## Scope

### In Scope
- Delivery status evaluation: check order fulfillment state for `DELIVERED` status.
- Visibility logic: render the action button only when the delivery condition is met; hide otherwise.
- Disabled state: render the button disabled when a post-sale request is already in progress for the order.
- Customer Account UI extension targeting for order list (index) and order detail surfaces.
- Redirection to `customer-account-order-full-page` extension passing the target order identifier.
- Localization: ES + EN via extension locales (en.default.json / es.json), matching repo conventions.

### Out of Scope
- Post-sale flow execution logic (owned by the customer-account-order-full-page extension / Monitor Omnicanal).
- Direct ERP/SAP/logistics integration from the UI extension layer.
- Modifications to backend order fulfillment statuses in Shopify.
- Writing the "request in progress" marker: Monitor Omnicanal owns that write; this change only reads it.

## Capabilities

### New Capabilities
- `customer-account-postventa-entrypoints`: Exposes conditional entrypoint buttons in order list and detail views routing to the post-sale full-page extension.

### Modified Capabilities
- None

## Approach
- Leverage Customer Account UI extension targets:
  - `customer-account.order.action.menu-item.render` (order detail / action menu) — validated target, already in use by `customer-account-order-actions`.
  - `customer-account.order-index.block.render` (order list index) — subject to verification of per-order fulfillment data availability (see Risks).
  - Note: target `customer-account.order-status.action.render` does NOT exist; `customer-account.order.action.render` is the alternative validated detail surface if needed.
- Read order data through the Customer Account extension global API (`shopify.order`, `shopify.orderId`, status API per target), not React-style hooks (`useOrder`/`useFulfillments` do not exist in this framework).
- Verify `DELIVERED` fulfillment status from target-provided order data.
- Read the "request in progress" state from an order metafield written by Monitor Omnicanal; read it via the metafield access available on the target's order standard API. Exact metafield key must be confirmed against the Monitor contract before implementation (see Affected Areas / shopify.app.toml).
- Conditionally render/enable Button or MenuItem navigating to the `customer-account-order-full-page` route with `orderId`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `extensions/customer-account-order-actions/` | Modified | Add index target and conditional render/enable logic based on fulfillment state + request-in-progress metafield |
| `extensions/customer-account-order-actions/shopify.extension.toml` | Modified | Ensure targeting configuration covers index and detail targets |
| `extensions/customer-account-order-full-page/` | Modified | Verify route receiving and parameter handling for incoming order ID |
| `shopify.app.toml` | Modified | Declare the order metafield definition used to carry the request-in-progress state (key coordinated with Monitor) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Per-order fulfillment data may not be available at `customer-account.order-index.block.render` | Medium | Verify with Shopify Dev MCP before implementation. Fallback: render disabled/dormant on index or restrict enabled-state evaluation to detail target |
| Metafield key/write semantics not yet defined by Monitor | Medium | Freeze exact key and value contract during spec with Monitor team; fail closed (treat as no request in progress) while key is unresolved |
| Metafield read permissions differ across targets | Medium | Verify Customer Account API metafield read access on each target during design |
| Target API differences across Shopify API versions | Low | Stick to declared `2026-07` extension targets and test against Shopify Dev MCP |

## Rollback Plan
Revert changes in `extensions/customer-account-order-actions/`, extension TOML configurations, and `shopify.app.toml` metafield declaration to previous commit.

## Dependencies
- `extensions/customer-account-order-full-page` available and deployed in the app.
- Monitor Omnicanal writes the request-in-progress metafield on the order (contract coordination, not built in this change).

## Success Criteria
- [ ] Button appears on order list item only when order fulfillment status is `DELIVERED`.
- [ ] Button appears on order status detail page only when order fulfillment status is `DELIVERED`.
- [ ] Button is hidden for orders in pending, unfulfilled, in-transit, or cancelled states.
- [ ] Button renders disabled (not hidden) when a post-sale request is already in progress for that order.
- [ ] Clicking the button navigates to the customer account full-page extension with the corresponding order ID.
- [ ] Button copy is localized in ES and EN.