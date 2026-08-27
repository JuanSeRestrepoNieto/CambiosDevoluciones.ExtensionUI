# Tasks: boton-cambios-devoluciones (customer-account-postventa-entrypoints)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220–280 (additions + deletions; incl. spec wording amendment) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Two PRs (user decision 2026-08-27): PR1 = extension change (modules, targets, TOML metafield request, locales) — shippable independently, inert/fail-closed until Monitor writes the record; PR2 = any app-config change + dev-store validation of the visible button. Note: `crystal` is a merchant-owned namespace, so the `[order.metafields.app.*]` app-owned definition in `shopify.app.toml` is NOT applicable — no store-schema change expected; `shopify.app.toml` touched only if the value-shape confirmation reveals a needed definition |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

```text
Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

Decision needed before apply is **Yes** for two reasons: (1) the Monitor metafield contract (Phase 0, task 1) is a hard prerequisite for the config-bearing commits and for any visible-button validation; (2) the user asked to be consulted before any PR/chaining/delivery decision (ask-on-risk). Chain strategy stays `pending` because chaining is not flagged at this size.

## Frozen decisions this plan respects

- **NO button on the order list.** `customer-account.order-index.block.render` → fail-closed `PostventaNoop.jsx` (renders nothing; StandardApi-only target in 2026-07). Per-row list entrypoint descoped/deferred as follow-up (design D1).
- **Gated entrypoint renders ONLY at** `customer-account.order-status.cart-line-list.render-after` (below order lines), inside `extensions/customer-account-order-actions` (design D4).
- Enabled iff Monitor record `deliveryState == "DELIVERED"`; **disabled (not hidden)** iff `requestInProgress === true`; absent/unreadable record → **hidden** (fail closed, never an enabled entrypoint; unreadable in-progress state alone never disables) (design D3).
- Monitor-owned order metafield read via global `shopify.appMetafields`; **CONTRACT FROZEN (user, 2026-08-27): namespace `crystal`, key `cambios_devoluciones_ticket`**; value shape (deliveryState/requestInProgress) pending Monitor confirmation (#1b) — code parses defensively.
- Extension TOML metafield request (`[[extensions.metafields]]` / targeting-scoped, `namespace = "crystal"`, `key = "cambios_devoluciones_ticket"`) ships in PR1 (read-only request, no store-schema change). `shopify.app.toml` app-owned definition NOT applicable (merchant-owned namespace).
- Full-page extension `customer-account-order-full-page` is **UNCHANGED** (verified receiver of `extension://?orderId=`; design D5).
- Localization via `locales/en.default.json` + `locales/es.json` in `customer-account-order-actions`, resolved with `shopify.i18n.translate('entrypoint.action')` (design §3.4/§4.2).
- API `2026-07`, global `shopify.*` API only, no React hooks, never `customer-account.order-status.action.render` (does not exist).

## Testing note

No automated test runner exists in this repo (`openspec/config.yaml`: unit/integration/e2e empty). Verification is static review + dev-store scenario checks per design §7; acceptance-criteria-driven sequencing replaces RED/GREEN/TRIANGULATE, and each implementation task carries its static/validator verification inline. Generated code must be validated with the Shopify skill validator (`scripts/validate.mjs` with `--target customer-account.order-status.cart-line-list.render-after --version 2026-07`; shell access required — design §7 constraint).

## Phase 0 — Contract & spec preconditions (blocks config and visible-button validation)

- [ ] Record the FROZEN Monitor metafield contract (user-provided 2026-08-27: namespace `crystal`, key `cambios_devoluciones_ticket`, owner `order`) in `openspec/changes/boton-cambios-devoluciones/design.md` §4.1, and confirm the remaining value shape with Monitor (recommended `{"deliveryState": ..., "requestInProgress": boolean}` JSON string; exact field names/enum pending — open item #1b). The extension TOML metafield REQUEST does NOT wait on this (read-only); visible-button dev-store validation (Phase 3) and any `shopify.app.toml` change DO. <!-- sdd-owner: implementation -->
- [ ] Amend the delta spec wording per design D3 and open item #4: in `openspec/changes/boton-cambios-devoluciones/specs/customer-account-postventa-entrypoints/spec.md`, reword the delivery-state scenario language from "fulfillment status DELIVERED / target-provided fulfillment data" to "resolved delivery state as recorded by Monitor and provided through the target's metafield API"; record the cart-line-list placement and the descoped order-list entrypoint in the Target Surface Support requirement. Keep all scenario acceptance criteria intact and re-verify they still match design §7. <!-- sdd-owner: implementation -->

## Phase 1 — Component implementation (new modules; validator-gated)

- [ ] Implement `extensions/customer-account-order-actions/src/PostventaEntrypoint.jsx` — shared gated component: `resolveOrderId()` via `shopify.order?.value?.id` (fail closed when absent), `readMonitorRecord()` via `shopify.appMetafields.value.find(entry => entry.target.type === 'order' && entry.target.id === orderId && entry.metafield.namespace === <frozen> && entry.metafield.key === <frozen>)` with lenient `JSON.parse` in try/catch (malformed → null), pure `evaluate(record)` per design D3 rules (null → hidden; `deliveryState !== 'DELIVERED'` → hidden; `requestInProgress === true` → visible+disabled; else visible+enabled), rendering `null` | `<s-button disabled>` (no href) | `<s-button href={extension://?orderId=<encodeURIComponent(gid)>} variant="primary">` with label always `shopify.i18n.translate('entrypoint.action')`; no hardcoded copy, no hook imports. Verify with the skill validator. <!-- sdd-owner: implementation -->
- [ ] Implement `extensions/customer-account-order-actions/src/OrderStatusPostventa.jsx` — target module for `customer-account.order-status.cart-line-list.render-after` (OrderStatusApi & StandardApi intersection); imports `@shopify/ui-extensions/preact` + preact `render`, mounts `<PostventaEntrypoint/>` at `document.body` (one-shot render per repo style, 2026-07). Verify with the skill validator. <!-- sdd-owner: implementation -->
- [ ] Implement `extensions/customer-account-order-actions/src/PostventaNoop.jsx` — comment-documented fail-closed module (records design D1/D2 evidence at the call site: StandardApi-only index target and OrderApi orderId-only action-menu target cannot gate in 2026-07); renders nothing and reads nothing. Used at both `customer-account.order-index.block.render` and `customer-account.order.action.menu-item.render`. <!-- sdd-owner: implementation -->
- [ ] Update `extensions/customer-account-order-actions/shopify.d.ts` — remove the `./src/OrderActionMenuItem.jsx` block; add typed `declare module` blocks for `./src/OrderStatusPostventa.jsx` (per `customer-account.order-status.cart-line-list.render-after` Api) and `./src/PostventaNoop.jsx` (per-target entries for the index and action-menu target Apis); TypeScript check (`tsc --noEmit` per `tsconfig.json` with `checkJs`) must be clean. <!-- sdd-owner: implementation -->

## Phase 2 — Targeting, locales, and config

- [ ] Update `extensions/customer-account-order-actions/shopify.extension.toml` (`api_version = "2026-07"` unchanged): re-register `customer-account.order.action.menu-item.render` → `./src/PostventaNoop.jsx`; add `customer-account.order-status.cart-line-list.render-after` → `./src/OrderStatusPostventa.jsx`; add `customer-account.order-index.block.render` → `./src/PostventaNoop.jsx`; delete `extensions/customer-account-order-actions/src/OrderActionMenuItem.jsx` (replaced). Verify `shopify app build` (or equivalent extension build) succeeds with the new targeting. <!-- sdd-owner: implementation -->
- [ ] Add extension locale files per repo convention (app-home precedent): `extensions/customer-account-order-actions/locales/en.default.json` with `{"entrypoint": {"action": "Returns and exchanges"}}` and `extensions/customer-account-order-actions/locales/es.json` with `{"entrypoint": {"action": "Cambios y devoluciones"}}`; extension name/TOML stays literal (repo precedent for customer-account extensions). <!-- sdd-owner: implementation -->
- [ ] Add the customer-account metafield declaration to `extensions/customer-account-order-actions/shopify.extension.toml` using the verified syntax: `[[extensions.targeting.metafields]]` nested under the `order-status.cart-line-list.render-after` targeting block (target-scoped) — or `[[extensions.metafields]]` global entry — with `namespace = "crystal"` and `key = "cambios_devoluciones_ticket"`, so `shopify.appMetafields` hydrates the Monitor record at the order-status surface. Read-only request; no store-schema impact. <!-- sdd-owner: implementation -->
- [ ] `shopify.app.toml`: NO app-owned `[order.metafields.app.*]` definition needed (namespace `crystal` is merchant-owned; that block defines only `$app` app-owned metafields). Touch `shopify.app.toml` only if the Monitor value-shape confirmation (#1b) reveals a required definition. Verify `shopify app build`/config validation still passes. <!-- sdd-owner: implementation -->

## Phase 3 — Verification (design §7 scenario checklist; dev store)

Visible-button validation tasks V2–V5 depend on the Phase 0 contract freeze (dev-store record seeded with the frozen key/shape) and on the Phase 2 extension metafield declaration being live.

- [ ] V1 — Static review sweep: grep `extensions/customer-account-order-actions/src/**` for `useOrder`/`useFulfillments`/any React-hook imports (none allowed), for hardcoded customer-visible strings (none; all copy resolved via `shopify.i18n.translate('entrypoint.action')`), and confirm the entrypoint uses only `shopify.*` globals and target-provided data. <!-- sdd-owner: implementation -->
- [ ] V2 — Dev store, DELIVERED + `requestInProgress: true` record: entrypoint visible below order lines as `<s-button disabled>` with no `href`; manual click does not initiate navigation to the post-sale full page (delta spec: visible but non-interactive). <!-- sdd-owner: implementation -->
- [ ] V3 — Dev store, DELIVERED + absent/empty `requestInProgress`: enabled `<s-button href="extension://?orderId=<gid>">`; click navigates to `customer-account-order-full-page` which resolves the order via `shopify.order?.value?.id` (identical GID) or the `orderId` search param (deep-link contract, design D5; full-page extension unchanged). <!-- sdd-owner: implementation -->
- [ ] V4 — Dev store, metafield absent, malformed JSON, or unreadable at the surface: entrypoint hidden (delivery not confirmed → fail closed); the order is never disabled for the unreadable in-progress state alone (delta spec "Metafield unreadable on a surface"). <!-- sdd-owner: implementation -->
- [ ] V5 — Dev store, record with non-DELIVERED `deliveryState` (e.g. `UNFULFILLED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`): entrypoint hidden (delivery not confirmed → fail closed). <!-- sdd-owner: implementation -->
- [ ] V6 — Dev store, locale resolution: account locale en → `en.default.json` copy ("Returns and exchanges"); es → `es.json` copy ("Cambios y devoluciones"); unsupported locale (e.g. de) → `en.default.json` fallback; never a raw `entrypoint.action` key or empty label. <!-- sdd-owner: implementation -->
- [ ] V7 — Dev store + type evidence, fail-closed surfaces: order index page and order action menu show **no** post-sale entrypoint (`PostventaNoop` renders nothing at both `customer-account.order-index.block.render` and `customer-account.order.action.menu-item.render`; index target verified StandardApi-only in 2026-07, action-menu targets verified orderId-only). <!-- sdd-owner: implementation -->

## Phase 4 — Parent gates (post-apply, grouped)

- [ ] Post-apply bounded review of the change against every delta-spec scenario and the design §7 verification map; confirm the invariant checks (design §9: pure reader, Monitor writes / extension reads, no ERP integration, valid targets only) still hold. <!-- sdd-owner: parent -->
- [ ] Delivery decision gate (ask-on-risk): confirm with the user (1) Monitor contract freeze status — if not frozen, the config-bearing commits must be withheld and only the inert extension change applied; (2) single-PR vs two-phase deploy sequencing; (3) release-note communication of the placement change (action menu → below order lines, design open item #7) — before any PR is raised or deploy is run. <!-- sdd-owner: parent -->