## Why

Customers currently lack a direct, prominent entry point within their Shopify Customer Account pages to initiate order returns or exchanges. By adding a dedicated "Cambios y devoluciones" button to both the order list (Order Index) and the order detail view (Order Status), we provide a seamless, self-service channel for capturing post-sale requests.

## What Changes

- Scaffold a new Customer Account UI extension under `extensions/customer-account-returns` targeting `customer-account.order.action.menu-item.render`.
- Render a "Cambios y devoluciones" button next to each order in the Order Index page, and inside the action menu of the Order Status (detail) page.
- Add targeting for an order-specific full-page extension (`customer-account.order.page.render`) to render the return, withdrawal, missing item, and size exchange wizard flow.
- Configure deep-linking from the menu-item button to navigate the user directly into the full-page return request flow for that specific order.

## Capabilities

### New Capabilities

- `customer-account-returns-entry`: Renders a "Cambios y devoluciones" action menu button next to orders in the customer account list and detail views.
- `customer-account-returns-flow`: Renders a full-page order-specific wizard page (`customer-account.order.page.render`) allowing customers to select line items, specify flow types (RETURN, WITHDRAWAL, MISSING_ITEM, SIZE_EXCHANGE), submit requests, and track their progress.

### Modified Capabilities

None.

## Impact

- **App Structure**: A new UI extension package `extensions/customer-account-returns` will be created in the workspace.
- **Shopify App Configuration**: `shopify.app.toml` and workspace configs will be updated to register and deploy the new extension.
- **External Systems**: Handled via the existing Monitor Omnicanal integration contract; no direct calls to SAP, Wompi, CEGID, or logistics providers will be placed by the extension.
