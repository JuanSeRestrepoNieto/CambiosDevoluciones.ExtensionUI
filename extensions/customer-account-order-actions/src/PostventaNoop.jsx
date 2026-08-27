/**
 * Fail-closed module for Customer Account surfaces that cannot gate the post-sale
 * entrypoint on API 2026-07. Registered at both:
 *
 * - customer-account.order-index.block.render → StandardApi only (design D1): no per-order
 *   identity, no order object, no fulfillment state, and no appMetafields. The block renders
 *   once per page (not per order row) and 2026-07 provides no way to evaluate a listed order
 *   here. Rendering anything would produce an ungated entrypoint.
 * - customer-account.order.action.menu-item.render → StandardApi & OrderApi (design D2):
 *   exposes only `orderId` — no order object, no fulfillment state, no metafield access — so
 *   the DELIVERED gate and the request-in-progress gate cannot be evaluated at this surface.
 *
 * Per the delta spec ("When the data required to evaluate a listed order is unavailable on a
 * given surface, the extension MUST fail closed ... never an enabled entrypoint"), this module
 * renders nothing and reads nothing. Upgrade path: if Shopify later exposes per-order context
 * on the index target, this quiet module can be replaced by a per-order renderer without
 * reconfiguring the targeting.
 */
export default async () => {
  // Intentional no-op — fail closed by rendering nothing.
};