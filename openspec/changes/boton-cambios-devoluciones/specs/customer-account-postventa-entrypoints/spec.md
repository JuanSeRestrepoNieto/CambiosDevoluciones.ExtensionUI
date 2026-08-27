# Delta for customer-account-postventa-entrypoints

Scope: converts the Customer Account post-sale entrypoint from an unconditional button into a conditionally gated, localized entrypoint on the order list (index) and order detail action menu. Corrects target naming (`customer-account.order-status.action.render` does not exist; valid surfaces are `customer-account.order.action.menu-item.render`, `customer-account.order.action.render`, and `customer-account.order-index.block.render`), specifies data access via the Customer Account extension global API (`shopify.*`) instead of non-existent React hooks, and adds disabled rendering while a post-sale request is in progress. API version: `2026-07`. Requirements are expressed target-agnostically where per-target data availability is unverified. Each `#### Scenario` is a testable acceptance criterion for its requirement.

## ADDED Requirements

### Requirement: Request-in-Progress Disabled Rendering

When a post-sale request is already in progress for the order, the entrypoint MUST render as disabled (visible but non-interactive); it MUST NOT be hidden and MUST NOT be rendered as enabled in that state. The in-progress state MUST be read from the order metafield written by Monitor Omnicanal, using the metafield access provided by the target's order data; the exact metafield namespace/key/value contract is pending Monitor and MUST be frozen with Monitor before implementation (this spec intentionally does not invent a key name). The entrypoint MUST only read this state: Monitor Omnicanal exclusively owns its write, and the Customer Account extension MUST NOT become a post-sales orchestration engine or integrate directly with ERP/SAP/logistics. When the metafield is absent or cannot be resolved on a given surface, the extension MUST treat the order as having no request in progress (fail closed to normal delivery-gated evaluation) and MUST NOT disable the entrypoint based on unreadable state.

#### Scenario: Request in progress renders entrypoint disabled

- GIVEN an order with at least one fulfillment in `DELIVERED` status
- AND the order's Monitor-written metafield indicates a post-sale request is in progress
- WHEN the entrypoint renders on the order detail or order index surface
- THEN the entrypoint is visible but disabled
- AND triggering it does not initiate navigation to the post-sale full page.

#### Scenario: No in-progress marker leaves entrypoint enabled

- GIVEN a delivered order whose request-in-progress metafield is absent or empty
- WHEN the entrypoint evaluates enablement
- THEN the entrypoint renders enabled, subject only to the delivery condition.

#### Scenario: Metafield unreadable on a surface

- GIVEN a surface where the request-in-progress metafield cannot be resolved
- WHEN the entrypoint evaluates enablement
- THEN the order is treated as having no request in progress
- AND the entrypoint is not disabled for that reason alone.

### Requirement: Localized Copy (Spanish and English)

The entrypoint copy MUST be provided in both Spanish and English through the extension locale files `en.default.json` and `es.json`, following the repo's extension locale conventions. All customer-visible entrypoint strings MUST be resolved through the extension's localization mechanism; the entrypoint component MUST NOT contain hardcoded user-facing copy.

#### Scenario: English customers see English copy

- GIVEN a customer whose account locale resolves to English
- WHEN the entrypoint renders
- THEN the visible copy is the English translation from `en.default.json`.

#### Scenario: Spanish customers see Spanish copy

- GIVEN a customer whose account locale resolves to Spanish
- WHEN the entrypoint renders
- THEN the visible copy is the Spanish translation from `es.json`.

#### Scenario: Locale outside the supported set

- GIVEN a customer locale that is neither Spanish nor English
- WHEN the entrypoint renders
- THEN the copy resolves through the extension's locale fallback
- AND the entrypoint never renders the raw translation key or an empty label.

### Requirement: Data Access via Customer Account Extension Global API

The entrypoint MUST obtain order identity, delivery/fulfillment state, and request-in-progress state through the Customer Account extension global API and per-target standard APIs provided by this framework (for example `shopify.orderId`, `shopify.order`, and per-target status/order data). It MUST NOT rely on React-style hooks such as `useOrder` or `useFulfillments`, which are not provided by this framework.

#### Scenario: Order identity at the action menu target

- GIVEN the entrypoint mounted at `customer-account.order.action.menu-item.render`
- WHEN it resolves the target order
- THEN it uses the global API order identifier (`shopify.orderId` or equivalent target-provided order ID).

#### Scenario: Delivery state from target-provided data

- GIVEN a target that provides order data
- WHEN the entrypoint evaluates the delivery condition
- THEN it reads fulfillment/delivery state exclusively from target-provided data
- AND a static review of the entrypoint source finds no `useOrder`/`useFulfillments` imports or calls.

#### Scenario: Required data not available at a surface

- GIVEN a surface where the needed order data is not provided
- WHEN the entrypoint evaluates
- THEN it fails closed per the visibility requirement and renders no enabled entrypoint.

## MODIFIED Requirements

### Requirement: Target Surface Support

The extension MUST support entrypoints on both the Customer Account order list (index) and the order detail surfaces using valid targeting only: `customer-account.order.action.menu-item.render` for the order action menu (validated and already in use), `customer-account.order.action.render` as the alternative validated detail surface, and `customer-account.order-index.block.render` for the order list. The extension MUST NOT target `customer-account.order-status.action.render`, which does not exist in this framework. Per-order enable/disable evaluation MUST be performed on the order-index surface for each listed order. When the data required to evaluate a listed order is unavailable on a given surface, the extension MUST fail closed for that order by rendering nothing or a dormant non-interactive block — never an enabled entrypoint.

(Previously: requirement referenced generic "order status (detail)" surfaces without naming valid Shopify targets and without index-specific fail-closed behavior.)

#### Scenario: Order index per-order evaluation

- GIVEN a customer viewing the order list rendered through `customer-account.order-index.block.render`
- AND the target provides per-order context for a listed order
- WHEN the extension evaluates that order against the delivery and request-in-progress conditions
- THEN the entrypoint for that order is rendered enabled, disabled, or hidden accordingly.

#### Scenario: Index surface without per-order data

- GIVEN an order-index surface that does not expose per-order fulfillment or request-in-progress data for an order
- WHEN the extension cannot confirm the delivery condition for that order
- THEN the extension fails closed
- AND no enabled entrypoint is rendered for that order.

#### Scenario: Order detail action menu entrypoint

- GIVEN a customer viewing an order detail page with the action menu
- WHEN the order matches the delivery and request-in-progress conditions
- THEN the action is rendered in the order action menu via `customer-account.order.action.menu-item.render` (or the alternative validated detail surface `customer-account.order.action.render`).