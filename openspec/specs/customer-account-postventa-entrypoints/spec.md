# customer-account-postventa-entrypoints Specification

## Purpose
Define requirements and scenarios for rendering conditional action entrypoints in Customer Account (order list and order detail) that allow customers to initiate post-sale operations (returns/exchanges) on delivered orders.

## Requirements

### Requirement: Conditional Visibility by Delivery Status
The entrypoint button/action MUST be rendered if and only if the order has at least one fulfillment in `DELIVERED` status (or equivalent resolved delivery state).

#### Scenario: Order is delivered
- **GIVEN** an authenticated customer viewing their order list or order detail
- **AND** the order has a fulfillment with status `DELIVERED`
- **WHEN** the extension component mounts and resolves order fulfillment state
- **THEN** the post-sale action button/menu item is visible and enabled.

#### Scenario: Order is not delivered
- **GIVEN** an authenticated customer viewing their order list or order detail
- **AND** the order has fulfillments in `UNFULFILLED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, or cancelled state
- **WHEN** the extension component mounts and resolves order fulfillment state
- **THEN** the post-sale action button/menu item is NOT rendered (hidden).

#### Scenario: Fulfillment data unavailable or loading
- **GIVEN** an order whose fulfillment data is unresolved or empty
- **WHEN** the component evaluates delivery eligibility
- **THEN** the component fails closed and renders nothing until delivery is explicitly confirmed.

---

### Requirement: Target Surface Support
The extension MUST support entrypoints in both the Customer Account order index (list) and the order status (detail) surfaces.

#### Scenario: Order Index (List) entrypoint
- **GIVEN** a customer viewing the order list page
- **WHEN** an order row matches the delivery condition
- **THEN** the action is accessible for that specific order.

#### Scenario: Order Detail entrypoint
- **GIVEN** a customer viewing a specific order status page
- **WHEN** the order matches the delivery condition
- **THEN** the action is accessible within the order actions area or header.

---

### Requirement: Deep Link Navigation to Post-Sale Full Page
Triggering the entrypoint action MUST navigate the customer to the dedicated post-sale full-page extension (`customer-account-order-full-page`) carrying the current order identifier.

#### Scenario: Navigation execution
- **GIVEN** a delivered order with visible post-sale action
- **WHEN** the customer clicks or triggers the action
- **THEN** the application initiates navigation to the full-page extension route passing the target `orderId` or GID parameter.
