# Shopify Agent Architecture

This repository ships a production multi-agent environment for OpenCode whose purpose is
to develop, maintain, review, refactor, validate, and troubleshoot Shopify applications
using Shopify's current official development tooling as the source of truth.

Two agent layers coexist:

- the **postventa layer** (AGENTS.md) — small, domain-specific agents for post-sale
  flows (RETURN, WITHDRAWAL, MISSING_ITEM, SIZE_EXCHANGE);
- the **Shopify layer** (`.opencode/agents/`) — general-purpose Shopify specialists.

This document covers the Shopify layer.

## Architecture

```
                  OPEN CODE (opencode.json + instructions)
                      │
                      ▼
          postventa-architect (post-sale flows) / shopify-architect (generic Shopify work)
                      │
        ┌─────────────┼─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼             ▼
 shopify-admin-api  app-backend  app-frontend  extensions  functions/webhooks
        │             │             │             │             │
        ├──────┬──────┼──────┬──────┼──────┬──────┼──────┬──────┘
        ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   security  data-modeler (specialists; also postventa-* set for domain work)
        │
        ▼
   shopify-reviewer (final gate: PASS / PASS with warnings / REJECT)
        │
        ├─────────────► Shopify AI Toolkit (vendored skills in .opencode/skills/)
        └─────────────► Shopify Dev MCP (shopify-dev-mcp, npx @shopify/dev-mcp)
                          │
                          ▼
                 Current Shopify schemas + documentation (source of truth)
```

OpenCode provides orchestration. Our custom agents provide responsibility boundaries.
The Shopify AI Toolkit provides Shopify-specific reusable capabilities. The Shopify Dev
MCP provides current Shopify development context. Shopify's current schemas and
documentation remain the source of truth.

## Agent matrix

| Agent | Primary responsibility | Shopify Skills | MCP | Can modify code |
| --- | --- | --- | --- | --- |
| `shopify-architect` | Architecture/orchestration | selective | Yes | Yes |
| `shopify-admin-api` | Admin GraphQL | `shopify-admin` | Yes | Yes |
| `shopify-app-backend` | Backend (extension-only repo; behind Monitor) | selective | Yes | Yes |
| `shopify-app-frontend` | Embedded admin UI (App Home / Sidekick) | `shopify-polaris-app-home` | Yes | Yes |
| `shopify-extensions` | UI extensions (Customer Account, App Home, tools) | `shopify-polaris-customer-account-extensions`, `shopify-polaris-app-home` | Yes | Yes |
| `shopify-functions` | Shopify Functions | `shopify-functions` | Yes | Yes |
| `shopify-webhooks` | Webhook lifecycle | `shopify-webhooks` | Yes | Yes |
| `shopify-security` | Platform security | selective | Yes | Prefer review |
| `shopify-data-modeler` | Metafield/metaobject/native-resource decisions | `shopify-custom-data` | Yes | Yes |
| `shopify-reviewer` | Final Shopify review | validation skills | Yes | Prefer no |

Post-sale domain agents (`postventa-*`, `customer-account-extension`, `monitor-integration`,
`security`, `test-engineer`) are documented in AGENTS.md and remain the authority for
post-sale flow behavior.

## Delegation matrix

| Work | Delegate to |
| --- | --- |
| Admin GraphQL query/mutation | `shopify-admin-api` |
| Embedded admin screen / App Home / Sidekick | `shopify-app-frontend` |
| Customer Account / UI extension surface | `shopify-extensions` |
| Discount/business Function | `shopify-functions` |
| Webhook subscription/processing | `shopify-webhooks` |
| OAuth/access scope/secret concern | `shopify-security` |
| Metafield vs metaobject vs native resource | `shopify-data-modeler` |
| Server-side service (only when justified) | `shopify-app-backend` |
| Cross-cutting/architecture feature | `shopify-architect` |
| Post-sale flow (RETURN, WITHDRAWAL, MISSING_ITEM, SIZE_EXCHANGE) | `postventa-architect` chain |
| Final Shopify correctness | `shopify-reviewer` |

## Skills matrix

Vendored official Shopify AI Toolkit skills (`.opencode/skills/`), kept in sync by
`scripts/update-shopify-ai-toolkit.mjs`:

| Skill | Upstream source | Used by |
| --- | --- | --- |
| `shopify-admin` | Shopify/Shopify-AI-Toolkit | `shopify-admin-api`, `shopify-data-modeler`, `shopify-webhooks` |
| `shopify-use-shopify-cli` | Shopify/Shopify-AI-Toolkit | `shopify-extensions`, config validation |
| `shopify-custom-data` | Shopify/Shopify-AI-Toolkit | `shopify-data-modeler` |
| `shopify-functions` | Shopify/Shopify-AI-Toolkit | `shopify-functions` |
| `shopify-polaris-app-home` | Shopify/Shopify-AI-Toolkit | `shopify-app-frontend`, `shopify-extensions` |
| `shopify-polaris-customer-account-extensions` | Shopify/Shopify-AI-Toolkit | `shopify-extensions` |
| `shopify-webhooks` | **custom** (no upstream equivalent) | `shopify-webhooks` |

Each vendored `SKILL.md` carries an `OPENCODE-INTEGRATION` block with provenance and the
OpenCode-specific integration notes. Upstream instructions are preserved verbatim.

## MCP usage

- `shopify-dev-mcp` is configured in `opencode.json` (`npx -y @shopify/dev-mcp@latest`)
  and available to every agent that needs documentation search, schema inspection,
  GraphQL knowledge, extension knowledge, and validation.
- Agents must verify Shopify semantics through the MCP before writing code; model memory
  is never authoritative for Shopify semantics.

## Validation workflow

1. Search before writing: `search_docs_chunks` (Dev MCP) or vendored `search_docs.mjs`.
2. Implement the smallest correct artifact.
3. Validate:
   - GraphQL → `validate_graphql_codeblocks` or `shopify-admin` skill `validate.mjs`;
   - components → `validate_component_codeblocks` or polaris skill `validate.mjs`
     (pass `--target` for customer-account);
   - config → `shopify app config validate --json`;
   - Liquid/theme → `validate_theme`.
4. Fix errors (max 3 retries), report warnings separately.
5. For significant work, `shopify-reviewer` returns PASS / PASS (with warnings) /
   REJECT (equivalently APPROVED / APPROVED WITH WARNINGS / CHANGES REQUIRED).

## Update procedure

Keep vendored skills in sync with upstream Shopify/Shopify-AI-Toolkit:

```bash
node scripts/update-shopify-ai-toolkit.mjs            # clone upstream + sync
node scripts/update-shopify-ai-toolkit.mjs --check    # dry-run report
node scripts/update-shopify-ai-toolkit.mjs --source <checkout>   # use an existing clone
```

The script:

1. clones upstream (shallow) — or reuses `--source`;
2. copies the configured skill set into `.opencode/skills/`;
3. rewrites `SKILL.md`: removes the Claude Code `hooks:` frontmatter and injects the
   `OPENCODE-INTEGRATION` block (provenance + script path guidance);
4. **never silently overwrites local customizations** — files that differ from upstream
   (and are not exactly the generated form) are reported as conflicts and left intact.

See `scripts/update-shopify-ai-toolkit.mjs` for details.

## Security and least privilege

- Agents apply least privilege: implementation agents have scoped read/edit/bash access;
  `shopify-security` is read/analysis-first; `shopify-reviewer` cannot edit files.
- Shopify access scopes are derived from validated operations (never broad fallbacks).
- Secrets never appear in source or client-side env vars.
- Store mutations require explicit approval and prefer development stores.

## Telemetry

Vendored skill scripts report usage to `shopify.dev/mcp/usage`. Opt out with
`OPT_OUT_INSTRUMENTATION=true`. Details in `.opencode/instructions/shopify-source-of-truth.md`.