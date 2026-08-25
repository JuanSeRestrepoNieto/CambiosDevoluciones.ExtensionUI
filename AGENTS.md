# Agent Notes

## Scope and architecture
- This is an extension-only Shopify app (no backend service in repo).
- Workspace packages are only `extensions/*` (`pnpm-workspace.yaml`); main runtime code is in:
  - `extensions/app-home` (`admin.app.home.render`, Preact UI extension)
  - `extensions/app-tools` (`admin.app.tools.data`, Sidekick data tools)
- Shared domain logic lives in `shared/models/faq.ts` and `shared/utils/gid.ts`; both extensions import from there.

## Postventa multi-agent model
- Agent set for this repo is domain-specific and intentionally small:
  - `postventa-architect` (primary orchestrator)
  - `customer-account-extension`
  - `shopify-api`
  - `postventa-domain`
  - `monitor-integration`
  - `security`
  - `test-engineer`
  - `shopify-reviewer`
- The single agent with full-system authority is `postventa-architect`.
- Every implementation must end in `shopify-reviewer` with explicit PASS/REJECT.

## Shopify agent layer
- A parallel, general-purpose Shopify agent layer is defined in `.opencode/agents/` for
  Shopify application work that is not post-sale-flow-specific:
  - `shopify-architect` (orchestrator, mode `all`; available as a primary agent via Tab)
  - `shopify-admin-api`, `shopify-app-backend`, `shopify-app-frontend`,
    `shopify-extensions`, `shopify-functions`, `shopify-webhooks`,
    `shopify-security`, `shopify-data-modeler`
  - `shopify-reviewer` (repo-local final gate; supersedes the global agent of the same
    name for this repo and honors BOTH the postventa PASS/REJECT contract and the
    Shopify review standards APPROVED / APPROVED WITH WARNINGS / CHANGES REQUIRED)
- Routing rule:
  - Post-sale flow work (RETURN, WITHDRAWAL, MISSING_ITEM, SIZE_EXCHANGE) → the
    `postventa-*` chain below, ending in `shopify-reviewer`.
  - Generic Shopify app work (UI, Admin GraphQL, extensions, functions, webhooks,
    custom data, security, deployment) → `shopify-architect`, which delegates to the
    `shopify-*` specialists and ends in `shopify-reviewer`.
- Shared Shopify source-of-truth, security, and validation rules live in
  `.opencode/instructions/` (loaded via `opencode.json`).
- Vendored official Shopify AI Toolkit skills live in `.opencode/skills/` and are kept
  in sync with upstream by `scripts/update-shopify-ai-toolkit.mjs`.

## Domain context (required)
- Supported post-sale flows:
  - `RETURN`
  - `WITHDRAWAL`
  - `MISSING_ITEM`
  - `SIZE_EXCHANGE`
- Business orientation: the Customer Account extension is capture and tracking UI.
- Monitor Omnicanal is the orchestration engine and enterprise integration boundary.

## Critical architectural invariants
- The Customer Account extension is not the post-sales orchestration engine.
- Do not move Monitor responsibilities into the Shopify extension unless there is an explicit architectural decision approving it.
- Never integrate the Shopify extension directly with SAP, Wompi, CEGID, or logistics providers.
- All enterprise-system interaction belongs behind the Monitor contract.
- A valid order ID is never sufficient authorization.
- Any operation affecting an order must verify that the authenticated customer is entitled to operate on that order.

## Delegation chain
- Default execution chain for feature work:
  1. `postventa-architect`
  2. `postventa-domain`
  3. `shopify-api`
  4. `customer-account-extension`
  5. `monitor-integration`
  6. `security`
  7. `test-engineer`
  8. `shopify-reviewer`
- Agent order can vary when needed, but reviewer is always last.

## Shopify Dev MCP policy
- Use Shopify Dev MCP as the source of truth for Shopify capabilities.
- Vendored Shopify AI Toolkit skills in `.opencode/skills/` mirror upstream Shopify
  skills and are the preferred skill layer; load them with the `skill` tool when a task
  matches their trigger conditions. Their scripts run from the repository root as
  `node .opencode/skills/<name>/scripts/<script>.mjs ...`.
- For Shopify-specific implementation:
  1. Identify Shopify surface.
  2. Identify API version.
  3. Verify through Shopify Dev MCP.
  4. Verify required scopes.
  5. Validate GraphQL or component output with Shopify validation tools.
- Never invent Shopify fields, mutations, queries, extension targets, components, or capabilities.

## Commands (root)
- Start local Shopify dev session: `pnpm dev` (runs `shopify app dev`).
- Build extensions/app bundle: `pnpm build` (runs `shopify app build`).
- Deploy app + config: `pnpm deploy` (runs `shopify app deploy`).
- App metadata/debug info: `pnpm info`.
- Scaffold extension artifacts: `pnpm generate`.

## Shopify-specific invariants
- FAQ data model is defined in `shopify.app.toml` (`[metaobjects.app.faq]` + `[product.metafields.app.faq]`); update this file when changing FAQ fields.
- `shopify.app.toml` has `include_config_on_deploy = true`, so deploy pushes config/schema changes.
- GraphQL calls in `shared/models/faq.ts` target `shopify:admin/api/2026-07/graphql.json`; keep API-version changes synchronized with extension/app config.
- FAQ IDs cross layers in two forms:
  - Admin GraphQL GID (stored/returned by API)
  - Numeric ID (route/tool input); conversions are centralized in `shared/utils/gid.ts`.

## Tooling and instructions
- Use the Shopify AI Toolkit for Shopify API/platform tasks; do not add extra Shopify tooling to this repo.
- `mcp.json` is configured for `@shopify/dev-mcp` via `npx`.
- `.graphqlrc.js` auto-discovers `extensions/*/schema.graphql`; if schemas are regenerated, keep documents under the same extension directories.

## Verification reality
- No repo-defined lint/test/typecheck scripts exist at root; the reliable verification path here is focused runtime validation via `pnpm dev` and targeted Shopify extension behavior checks.
