## Context

Currently, the application codebase consists of `app-home` (Admin App Home extension) and `app-tools` (Sidekick tools). Customers accessing their Shopify account have no self-service returns entry point. To support customer returns, exchanges, retracts, or missing items reporting, we need to create a Customer Account UI Extension.

This extension will hook into the order action menus on both the order list page (Order Index) and the order detail page (Order Status), presenting a "Cambios y devoluciones" option. Clicking this option will redirect the user to a dedicated full-page wizard within their customer account where they can configure and submit their return requests.

## Goals / Non-Goals

**Goals:**
- Provide a consistent, modern entry point for post-sale requests in Customer Accounts.
- Render the entry point button in the correct action menus (list of orders and order details).
- Navigate cleanly to a full-page order-specific returns wizard using the Navigation API and custom protocols.
- Design a reusable multi-step Wizard step container for return requests (Return, Withdrawal, Missing Item, Size Exchange) using standard Polaris web components.
- Ensure security and authentication scopes: only authorized buyers can act on their own orders.
- Encapsulate all backend operations behind the Monitor Omnicanal integration contract.

**Non-Goals:**
- Implement the actual backend orchestration logic in this UI repository.
- Support storefront themes or legacy Liquid templates; this change is fully scoped to Customer Account UI Extensions.
- Direct integration with SAP, Cegid, Wompi, or logistics providers (belongs to the Monitor layer).

## Decisions

### 1. Unified Extension Package vs. Multiple Extension Packages
- **Decision**: Create a single UI extension package named `extensions/customer-account-returns` that registers multiple targets rather than separate packages for each target.
- **Rationale**: Keeps the workspace package hierarchy clean, avoids duplication of shared helpers and configurations, and simplifies build and deployment steps. Shopify extensions permit registering multiple targets within `shopify.extension.toml` as long as they are distinct.
- **Alternatives Considered**: Separate extension packages for action menu buttons and full-page rendering. Rejected due to increased boilerplate and complex code sharing.

### 2. Deep-linking and Navigation Protocol
- **Decision**: Navigate from the action menu button to the full page via `shopify.navigation.navigate('extension://customer-account-returns')` (using the extension's deep-link protocol).
- **Rationale**: This is the standard, secure, and officially supported method to deep-link between targets in Shopify Customer Accounts. Since the full-page extension targets `customer-account.order.page.render` (which is order-specific), it is instantiated automatically with the current order context (`shopify.orderId`, `shopify.order` and `shopify.lines`) available on the runtime scope.
- **Alternatives Considered**: Direct hardcoded query parameters or absolute URLs. Rejected because it violates Shopify target boundaries and domain isolation constraints.

### 3. Step-by-Step Wizard Architecture (Preact-based State Machine)
- **Decision**: Use a single-page state machine layout inside the full-page target `customer-account.order.page.render` with sub-components for each step.
- **Rationale**: Keeps the wizard snappy and prevents page-load overhead. Standardizes steps (`selection` ➔ `flow-details` ➔ `logistics` ➔ `review` ➔ `submitted`) using a shared layout container, ensuring unified error-handling, validation, and loader behavior.
- **Alternatives Considered**: Routing via multiple sub-routes. Rejected as sub-routing within UI extensions adds unnecessary routing library weight and complexity for a single sequential wizard.

## Risks / Trade-offs

- **[Risk]**: The full-page extension might load outdated order details or fail to validate customer entitlement if the session expires.
  - **Mitigation**: Leverage Shopify's native pre-authenticated session details and validate the request on the Monitor side using secure session tokens.
- **[Risk]**: Rendering custom elements or HTML in Customer Accounts may fail strict Shopify validation constraints.
  - **Mitigation**: Enforce the exclusive use of supported `<s-*>` Polaris web components and validate the JSX/TSX structure using the `shopify-dev-mcp_validate_component_codeblocks` validator.
- **[Risk]**: Network delays when checking order eligibility.
  - **Mitigation**: Implement standard `<s-spinner>` loaders and robust error-state screens inside the extension.
