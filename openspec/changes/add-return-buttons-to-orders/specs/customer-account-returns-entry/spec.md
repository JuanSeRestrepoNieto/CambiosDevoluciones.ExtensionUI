## ADDED Requirements

### Requirement: Render Action Button in Order Index Page
The system SHALL render the "Cambios y devoluciones" button on each order card on the Customer Account Order Index page using the `customer-account.order.action.menu-item.render` target.

#### Scenario: Button displays on order index card
- **WHEN** the customer visits their Order Index page
- **THEN** the system SHALL display the "Cambios y devoluciones" option inside the actions menu for each eligible order

### Requirement: Render Action Button in Order Status Page
The system SHALL render the "Cambios y devoluciones" button on the Order Status page using the `customer-account.order.action.menu-item.render` target.

#### Scenario: Button displays on order status page
- **WHEN** the customer views the details of a specific order
- **THEN** the system SHALL display the "Cambios y devoluciones" option inside the order action menu

### Requirement: Navigation to Returns Wizard
When the "Cambios y devoluciones" button is clicked, the system SHALL navigate the customer to the returns full-page extension using the Navigation API deep-link protocol `extension://customer-account-returns`.

#### Scenario: Navigate to returns wizard successfully
- **WHEN** the customer clicks the "Cambios y devoluciones" button
- **THEN** the system SHALL navigate the user to the returns full-page wizard passing the active order context
