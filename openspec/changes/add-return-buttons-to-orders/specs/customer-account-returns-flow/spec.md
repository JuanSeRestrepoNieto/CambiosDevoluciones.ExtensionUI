## ADDED Requirements

### Requirement: Line Item Selection
The wizard SHALL display the list of line items belonging to the active order, showing product images, titles, variant details, prices, and quantity selectors.

#### Scenario: Customer selects items and quantities
- **WHEN** the customer views the item selection step of the returns wizard
- **THEN** the system SHALL allow selecting which items to return and adjusting their return quantities up to the purchased amount

### Requirement: Request Type Selection
The wizard SHALL prompt the customer to select the type of post-sale request from the four supported flows: RETURN (Devolución), WITHDRAWAL (Retracto), MISSING_ITEM (Faltante), or SIZE_EXCHANGE (Cambio de Talla).

#### Scenario: Selection of return request type
- **WHEN** the customer continues from the item selection step
- **THEN** the system SHALL display the four return options and require selecting one to proceed

### Requirement: Flow-Specific Wizard Steps
The wizard SHALL dynamically present the correct series of steps based on the selected request type:
- RETURN: reasons ➔ resolution ➔ logistics ➔ review
- WITHDRAWAL: resolution ➔ logistics ➔ review
- MISSING_ITEM: resolution ➔ review
- SIZE_EXCHANGE: replacement size selection ➔ logistics ➔ review

#### Scenario: Size picker shown during exchange
- **WHEN** the customer selects the SIZE_EXCHANGE request type
- **THEN** the system SHALL prompt the customer to select the new replacement size for each item before advancing to logistics

### Requirement: Review and Secure Submit
The wizard SHALL present a full summary of the request (selected items, reasons, logistics, and resolutions) and securely submit it to the Monitor Omnicanal integration API upon customer approval.

#### Scenario: Successful return request submission
- **WHEN** the customer reviews the request summary and clicks "Enviar Solicitud"
- **THEN** the system SHALL submit the data to the Monitor Omnicanal integration layer, display a success banner, and show tracking details

### Requirement: Loading and Error Handling
The wizard SHALL display skeleton screens while loading order details and show a clear error banner if the API request fails or if validation boundaries are violated.

#### Scenario: Display API error screen
- **WHEN** the submission to the Monitor Omnicanal API fails due to network or validation errors
- **THEN** the system SHALL display an error banner with the message from the API and allow the customer to retry submission
