## 1. Setup & Scaffolding

- [x] 1.1 Scaffold the customer-account-returns UI extension using Shopify CLI
- [x] 1.2 Verify workspace package registry in pnpm-workspace.yaml and root files
- [x] 1.3 Add and resolve required dependencies in the extension package.json file
- [x] 1.4 Configure shopify.extension.toml to register both target modules: menu-item and full-page

## 2. Order Action Button Entry

- [x] 2.1 Implement the Preact action button component rendering "Cambios y devoluciones"
- [x] 2.2 Configure navigation deep-link in the button click handler using shopify.navigation.navigate
- [x] 2.3 Verify entry button rendering in both Order Index and Order Status pages

## 3. Full-Page Wizard Layout & Context Loading

- [x] 3.1 Design the Preact wizard page container using s-page and layout boxes
- [x] 3.2 Securely load order and line item context using shopify.order and shopify.lines APIs
- [x] 3.3 Implement the Line Item Selection step displaying thumbnails, variant details, and quantity inputs
- [x] 3.4 Implement the Request Type Selection step prompting for RETURN, WITHDRAWAL, MISSING_ITEM, or SIZE_EXCHANGE

## 4. Flow-Specific Wizard Steps

- [x] 4.1 Implement replacement size selection screen for the SIZE_EXCHANGE flow
- [x] 4.2 Implement reason/resolution select inputs for RETURN and WITHDRAWAL flows
- [x] 4.3 Implement logistics pickup/dropoff selector screens

## 5. Review, Secure Submission & Error States

- [x] 5.1 Implement the Request Review step rendering a read-only list of items, resolutions, and logistics
- [x] 5.2 Implement submit logic integration with the Monitor Omnicanal API contract
- [x] 5.3 Implement loading state skeleton screens using s-skeleton-paragraph
- [x] 5.4 Implement error state banner layouts using s-banner

## 6. Verification and Deployment

- [x] 6.1 Run validate_component_codeblocks to verify Preact component Polaris compliance
- [x] 6.2 Start a local dev session via pnpm dev to test full index-to-wizard navigation
- [x] 6.3 Build and deploy the finished extension to the Shopify Partner dashboard via pnpm deploy
