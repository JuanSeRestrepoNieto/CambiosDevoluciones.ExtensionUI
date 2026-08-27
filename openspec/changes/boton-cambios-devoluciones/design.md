# Design: Cambios y Devoluciones Entrypoints (boton-cambios-devoluciones)

- Change: `boton-cambios-devoluciones`
- Capability: `customer-account-postventa-entrypoints`
- Phase: design (dependencies `proposal`, `spec` READY; `explore` corrections incorporated)
- API version: `2026-07` (`@shopify/ui-extensions ~2026.7.0` installed)
- Design evidence baseline: installed package type declarations under
  `extensions/customer-account-order-actions/node_modules/@shopify/ui-extensions/src/surfaces/customer-account/`
  (authoritative for the exact 2026.7.0 API surface), repo baseline code, and the
  `shopify-polaris-customer-account-extensions` / `shopify-custom-data` / `shopify-customer` skills.

---

## 1. Evidence summary (what the 2026-07 API actually exposes)

Verified directly from the installed `@shopify/ui-extensions` 2026.7.0 type definitions
(`src/surfaces/customer-account/extension-targets.ts`, `api/standard-api/standard-api.ts`,
`api/order-status/order-status.ts`):

| Surface (target) | API intersection | Per-order identity | Order object | Fulfillment / DELIVERED | Order metafields | i18n.translate |
|---|---|---|---|---|---|---|
| `customer-account.order-index.block.render` | `StandardApi` | **NO** | NO | NO | NO | YES |
| `customer-account.order.action.menu-item.render` | `StandardApi & OrderApi` | `orderId` only | NO | NO | NO | YES |
| `customer-account.order.action.render` | `StandardApi & ActionExtensionApi & OrderApi` | `orderId` only | NO | NO | NO | YES |
| `customer-account.order-status.cart-line-list.render-after` | `OrderStatusApi & StandardApi` | `order.value.id` (GID) | YES (`Order`: id, name, cancelledAt, confirmationNumber, processedAt) | **NO** | `appMetafields` (order-owner entries supported) | YES |
| `customer-account.order.page.render` (full page) | `OrderStatusApi & StandardApi` | `order.value.id` | YES (same `Order`) | **NO** | `appMetafields` | YES |

Key type-level facts:

1. **`OrderApi` exposes only `orderId: string`** (standard-api.ts). The action-menu targets
   cannot read the order object, fulfillment state, or metafields.
2. **`Order` (OrderStatusApi) has no fulfillment/delivery field.** It exposes only
   `id`, `name`, `cancelledAt`, `confirmationNumber`, `processedAt`. `shopify.order.fulfillments`
   and any fulfillment-status field **do not exist** in this API version.
3. **`appMetafields: SubscribableSignalLike<AppMetafieldEntry[]>`** exists only on
   `OrderStatusApi`. `AppMetafieldEntryTarget.type` includes `'order'`, so app-owned
   **order** metafields are addressable — but the fields must be declared in
   `shopify.extension.toml` ("The metafields requested in the shopify.extension.toml file")
   and are returned in the `$app` format only (the extension's own app namespace; the
   fully-qualified `app--{id}` namespace is not supported).
4. **`StandardApi.i18n: I18n`** is present on every target, so `shopify.i18n.translate(key)`
   is available at the surfaces we use (repo precedent: `app-home` uses
   `shopify.i18n.translate('welcome', …)`).
5. No React-style hooks exist; the repo pattern is the global `shopify.*` object with a
   one-shot render (`render(<Component/>, document.body)`) and `.value` reads on
   `SubscribableSignalLike` (existing `OrderFullPage.jsx` reads `shopify.order?.value?.id`).

---

## 2. Decision log

### D1 — Index-target spike resolution (highest risk, RESOLVED)

**Question:** Does `customer-account.order-index.block.render` expose per-order data
(order/fulfillment/metafield) for each listed order?

**Answer: NO.** The target's API is `StandardApi` only (verified from installed types).
There is **no `orderId`, no `order` object, no fulfillment data, and no metafield access**
on the index target. The block renders once per page, not per order row; the framework
provides no way to iterate the customer's order list from this target in 2026-07
(`shopify.query` goes to the Storefront GraphQL API and the index target has no order
token / GID to query against; per-order rendering from the index block is not implementable
without inventing API fields, which is forbidden).

**Design consequence (per the delta spec's fail-closed machinery):** the order-list
(per-row) entrypoint **cannot ship in 2026-07**. Gated evaluation is restricted to the
detail surface. The index target is registered with a **fail-closed module that renders
nothing** (delta spec: "When the data required to evaluate a listed order is unavailable on
a given surface, the extension MUST fail closed for that order by rendering nothing or a
dormant non-interactive block — never an enabled entrypoint."). If Shopify later exposes
per-order context on the index target, the same fail-closed module can be upgraded to a
per-order renderer without extension reconfiguration.

**Call-out for stakeholders — RESOLVED (2026-08-27):** the proposal success criterion
"Button appears on order list item only when order fulfillment status is DELIVERED" is
**not shippable** on API 2026-07 (no per-order context on the index target; verified in
installed types). The stakeholder previously observed a per-order button in a dev-store
test, but after reviewing the type-level evidence, **decided: NO button on the order list**
(fail-closed module retained). The per-order list entrypoint is descoped/deferred as a
follow-up. The gated detail entrypoint ships. The delta spec's index scenarios remain
satisfied by fail-closed behavior.

### D2 — Metafield read mechanism per target

**Chosen mechanism:** declare the Monitor-owned order metafield in `shopify.extension.toml`
via `[[extensions.metafields]]` (all-targets) or `[[extensions.targeting.metafields]]`
(target-scoped, nested under the `order-status.cart-line-list.render-after` targeting block)
with `namespace = "crystal"` and `key = "cambios_devoluciones_ticket"`, so the platform
hydrates it into `shopify.appMetafields` at **OrderStatusApi surfaces**, and resolve the
entry on the order detail page via:

```ts
shopify.appMetafields.value.find(
  (entry) =>
    entry.target.type === 'order' &&
    entry.target.id === orderId &&
    entry.metafield.namespace === CONTRACT.namespace &&
    entry.metafield.key === CONTRACT.key,
);
```

**CONTRACT FROZEN (2026-08-27, user-provided):** namespace `crystal`, key
`cambios_devoluciones_ticket`, owner `order`. `crystal` is a merchant-owned namespace
(not `$app`) — merchant-owned namespaces ARE declarable/readable; the `$app` restriction
applies only to app-owned metafields (verified: customer-account configuration docs).
Writer = Monitor via Admin API; reader = this extension via `shopify.appMetafields`.
VALUE SHAPE: still to be confirmed with Monitor (recommended JSON
`{"deliveryState": ..., "requestInProgress": boolean}`); metafield values are strings,
so a JSON value is stored as a string and parsed with lenient JSON.parse. The exact value
shape/encoded field names remain a Monitor coordination item (design §6 open item #1b).

Limits that follow from the evidence:

- The action-menu targets (`order.action.menu-item.render`, `order.action.render`) and the
  index target **cannot read metafields at all** — hence they cannot self-gate, and per D1
  they ship fail-closed modules.
- Approved syntax verified: `[[extensions.metafields]]` + `namespace`/`key` keys
  (global scope) or `[[extensions.targeting.metafields]]` nested under a targeting block
  (target scope); `appMetafields` reads back the requested metafields.

### D3 — Delivery (`DELIVERED`) state evaluation

**Verified:** no Customer Account target exposes fulfillment or delivery status in 2026-07
(`Order` has no fulfillment field). The delta spec's scenario wording "reads
fulfillment/delivery state exclusively from target-provided data" is satisfiable only if
"delivery state" is carried in target-provided **metafield data** (`appMetafields`).

**Chosen mechanism:** delivery state is read from the **same Monitor-owned order metafield
record** as the request-in-progress flag. Monitor — the post-sales orchestration engine that
already integrates logistics/ERP — writes the resolved delivery state; the extension only
reads it (architecture invariant: "Monitor writes state, extension reads state"). This is the
canonical spec's "or equivalent resolved delivery state" branch — the only implementable
branch on 2026-07.

**Evaluation + fail-closed rule** (single pure function, used by the entrypoint):

```
evaluate(record):
  record == null                        → {visible: false}      // metafield absent or unreadable
  normalize(record.deliveryState) !== 'DELIVERED' → {visible: false}   // delivery not confirmed
  record.requestInProgress === true     → {visible: true, disabled: true}
  otherwise                             → {visible: true, disabled: false}
```

- Delivery not confirmed (absent / unreadable / any non-`DELIVERED` state) → **no enabled
  entrypoint** (fail closed; spec: "FAILS closed and renders nothing until delivery is
  explicitly confirmed").
- Request-in-progress metafield absent or unreadable → treated as **no request in progress**
  and the entrypoint is **not disabled for that reason alone** (delta spec), subject only to
  the delivery condition.

**Contract-pending:** the recommended record shape is a JSON object
`{"deliveryState": "DELIVERED"|"UNFULFILLED"|"IN_TRANSIT"|"OUT_FOR_DELIVERY"|…,
"requestInProgress": boolean}`, but the shape is **Monitor's call** (Monitor owns the write).
The extension parses defensively (JSON.parse in try/catch; malformed → `record == null`).

**Recommended spec amendment (flag, not silently contradicted):** the delta spec Scenario
"Delivery state from target-provided data" should be re-worded from "fulfillment status
DELIVERED" to "resolved delivery state as recorded by Monitor and provided through the
target's metafield API", since Shopify fulfillment status is not exposed to UI extensions in
2026-07. Same wording appears in the canonical spec's delivery requirement; the canonical
"or equivalent resolved delivery state" clause already accommodates the design.

### D4 — Component / state architecture

**One shared entrypoint component, three thin target modules, no React hooks.**

- `src/PostventaEntrypoint.jsx` — shared presentational/evaluation component. Reads the
  global `shopify.*` API at its target, runs `evaluate(record)`, and renders one of:
  `null` (hidden / fail-closed), a disabled `<s-button disabled>`, or an enabled
  `<s-button href={extension://?orderId=…} variant="primary">`. Label is always
  `shopify.i18n.translate('entrypoint.action')` — no hardcoded user-facing copy.
- `src/OrderStatusPostventa.jsx` — target module for
  `customer-account.order-status.cart-line-list.render-after` (renders once, after all line
  items on the order status page; full `OrderStatusApi & StandardApi`). Mounts
  `<PostventaEntrypoint/>`.
- `src/PostventaNoop.jsx` — fail-closed module registered at BOTH
  `customer-account.order-index.block.render` and
  `customer-account.order.action.menu-item.render`. Renders nothing (per D1/D2 these
  surfaces lack gateable data in 2026-07). Keeps the delta spec's required target
  registrations live without rendering ungated buttons.

State model: stateless one-shot render at mount (repo style; no hooks anywhere today).
`shopify.appMetafields.value` and `shopify.order?.value` are read once; optional
`subscribe()` re-render is not needed because gating inputs cannot change while the buyer
is on the page (a click navigates away). Document the trade-off; a `subscribe()` upgrade is
deferrable.

Why `cart-line-list.render-after` (and not the dynamic `order-status.block.render`): it is a
**static** target that always renders on every order status page (no checkout-editor
placement prerequisite), and it is exactly "rendered after all line items" — once per page,
not per line item (`cart-line-item.render-after` would render N times). The action-menu
target is the long-term UX home but lacks the APIs (D2); moving the visible button below the
order lines is an explicit, flagged consequence.

### D5 — Navigation

Confirmed against the working baseline:

- Keep the `extension://` deep-link pattern already in production:
  `href = \`extension://?orderId=${encodeURIComponent(orderId)}\``.
- Order identity source at the new surface: `shopify.order?.value?.id` (GID,
  `gid://shopify/Order/<id>`).
- `customer-account-order-full-page` already resolves the target order via
  `shopify.order?.value?.id` (preferred) and falls back to the `?orderId` search param
  (`OrderFullPage.jsx`). **No change required** in the full-page extension. The `extension://`
  custom protocol navigation is already validated by the running menu-item button.

### D6 — Config changes

- `extensions/customer-account-order-actions/shopify.extension.toml`:
  - Remove the unconditional menu-item rendering module; re-register
    `customer-account.order.action.menu-item.render` → `./src/PostventaNoop.jsx`
    (fail-closed; no ungated button is ever rendered).
  - Add `customer-account.order-status.cart-line-list.render-after` → `./src/OrderStatusPostventa.jsx`.
  - Add `customer-account.order-index.block.render` → `./src/PostventaNoop.jsx`.
  - Add the app-owned order metafield declaration so `appMetafields` hydrates the Monitor
    record (exact customer-account TOML key — see §6, verify-during-implementation item).
  - `api_version = "2026-07"` unchanged.
- `shopify.app.toml`:
  - Add `[order.metafields.app.<key-pending>]` definition (owner `order`, `$app` namespace,
    recommended `type = "json"`), so the definition exists in the app config that Monitor's
    Admin API writes conform to.
  - **`[build] include_config_on_deploy = true` implication:** the metafield definition is
    pushed to the store on the next `shopify app deploy`. This is a real store-schema change,
    so the definition must **not** be added until the Monitor contract (key/type) is frozen
    (§6) — an interim deploy without the definition is safe because the extension fails
    closed (renders nothing) while the record is absent.

---

## 3. Architecture

### 3.1 Surface map (post-change)

```
customer-account-order-actions (extension, api 2026-07)
├── [[extensions.targeting]] customer-account.order-status.cart-line-list.render-after → ./src/OrderStatusPostventa.jsx   (GATED ENTRYPOINT, renders on detail page below order lines)
├── [[extensions.targeting]] customer-account.order-index.block.render                  → ./src/PostventaNoop.jsx          (FAIL-CLOSED: no per-order data in 2026-07)
└── [[extensions.targeting]] customer-account.order.action.menu-item.render            → ./src/PostventaNoop.jsx          (FAIL-CLOSED: no metafield/fulfillment data at this target)

customer-account-order-full-page (extension, unchanged)
└── customer-account.order.page.render → ./src/OrderFullPage.jsx                      (already resolves orderId from target or ?orderId=)
```

### 3.2 Component tree

```
OrderStatusPostventa (target module, mounts via render(<PostventaEntrypoint/>, document.body))
└── PostventaEntrypoint
    ├── resolveOrderId()          → shopify.order?.value?.id        (fail closed on missing)
    ├── readMonitorRecord()       → appMetafields.value.find(order-owner entry) + lenient JSON.parse
    ├── evaluate(record)          → {visible, disabled}             (D3 rules)
    └── render                   → null | <s-button disabled> | <s-button href=extension://?orderId=…>
```

`PostventaNoop` (both fail-closed targets): comment-documented, renders nothing, reads
nothing — documents D1/D2 findings at the call site.

### 3.3 Data flow (detail page)

1. Buyer opens an order status (detail) page in Customer Account.
2. Shopify mounts the extension at `order-status.cart-line-list.render-after` with the
   global `shopify.*` API (`OrderStatusApi & StandardApi`).
3. `orderId = shopify.order?.value?.id`. If absent → fail closed (render nothing).
4. `shopify.appMetafields.value` → find the Monitor record entry for this order
   (namespace/key per frozen contract).
5. `record = JSON.parse(metafield.value)` (try/catch; malformed → `null`).
6. `evaluate(record)` → `{visible: false}` (not delivered / unknown) or
   `{visible: true, disabled}`.
7. Visible: render localized button. Enabled → `href` deep-links to the full-page route:
   `extension://?orderId=<gid>`; disabled → `<s-button disabled>` (no href, non-interactive).
8. Click → buyer lands on `customer-account-order-full-page`; that extension resolves the
   order from `shopify.order?.value?.id` (identical GID) or the `orderId` param.
9. Order list (index) and action-menu surfaces: modules render nothing (fail-closed).

### 3.4 Localization

- New locale files at the extension root (Shopify locale convention; `.default.json` is the
  fallback locale referenced by the SDK):
  - `extensions/customer-account-order-actions/locales/en.default.json`:
    `{"entrypoint": {"action": "Returns and exchanges"}}`
  - `extensions/customer-account-order-actions/locales/es.json`:
    `{"entrypoint": {"action": "Cambios y devoluciones"}}`
- Resolution: `shopify.i18n.translate('entrypoint.action')` (StandardApi on the entrypoint
  surface; repo precedent `app-home`). Unsupported locales fall back to `en.default.json`
  via the platform — never the raw key (verification: dev-store locale switch test).
- Extension `name`/TOML stays literal (repo precedent for the two customer-account
  extensions); localization scope is customer-visible entrypoint copy only.

---

## 4. Contracts

### 4.1 Monitor metafield contract (FROZEN namespace/key 2026-08-27; value shape pending)

| Field | Value |
|---|---|
| Owner | `order` |
| Namespace | `crystal` (merchant-owned; user-provided freeze) |
| Key | `cambios_devoluciones_ticket` (user-provided freeze) |
| Type | metafield value is a string (store JSON string for structured data; parsed leniently)
| Value shape (recommended) | `{"deliveryState": "DELIVERED"\|…, "requestInProgress": boolean}` — **final shape pending Monitor confirmation (open item #1b)** |
| Access | Monitor writes via Admin API |
| Writer | Monitor Omnicanal exclusively (Admin API) |
| Reader | This extension exclusively via `shopify.appMetafields` (OrderStatusApi surface), metafield declared in `shopify.extension.toml` (`[[extensions.metafields]]` or targeting-scoped) with `namespace = "crystal"`, `key = "cambios_devoluciones_ticket"` |

Extension TOML declaration (target-scoped example):

```toml
[[extensions.targeting]]
module = "./src/OrderStatusPostventa.jsx"
target = "customer-account.order-status.cart-line-list.render-after"

[[extensions.targeting.metafields]]
namespace = "crystal"
key = "cambios_devoluciones_ticket"
```

### 4.2 Localization key

`entrypoint.action` — ES `"Cambios y devoluciones"`, EN `"Returns and exchanges"`.

### 4.3 Navigation contract

`extension://?orderId=<encodeURIComponent(shopify.order.value.id)>` → full-page extension
(`customer-account-order-full-page`), unchanged receiver.

---

## 5. File-by-file change plan

| File | Change |
|---|---|
| `extensions/customer-account-order-actions/shopify.extension.toml` | Replace menu-item module; add `order-status.cart-line-list.render-after` target + targeting-scoped metafields request (`crystal`/`cambios_devoluciones_ticket`); add `order-index.block.render` target (fail-closed) |
| `extensions/customer-account-order-actions/shopify.d.ts` | Add typed `declare module` blocks for `./src/OrderStatusPostventa.jsx` (per `customer-account.order-status.cart-line-list.render-after` Api) and `./src/PostventaNoop.jsx` (union of the two target Apis, or per-target entries) |
| `extensions/customer-account-order-actions/src/OrderActionMenuItem.jsx` | **Replaced** by the three new modules below |
| `extensions/customer-account-order-actions/src/PostventaEntrypoint.jsx` | NEW shared gated component (D4) |
| `extensions/customer-account-order-actions/src/OrderStatusPostventa.jsx` | NEW order-status target module mounting `PostventaEntrypoint` |
| `extensions/customer-account-order-actions/src/PostventaNoop.jsx` | NEW fail-closed module (index + action-menu targets) |
| `extensions/customer-account-order-actions/locales/en.default.json` | NEW localization (EN) |
| `extensions/customer-account-order-actions/locales/es.json` | NEW localization (ES) |
| `shopify.app.toml` | **No expected change** (namespace `crystal` is merchant-owned; `[order.metafields.app.*]` defines only app-owned `$app` metafields). Touch only if Monitor value-shape confirmation (#1b) requires a definition |
| `extensions/customer-account-order-full-page/**` | **No change** (verified receiver) |

---

## 6. Open items / risks

| # | Open item / risk | Handling |
|---|---|---|
| 1 | **Monitor metafield contract**: namespace/key FROZEN (user, 2026-08-27): `crystal` / `cambios_devoluciones_ticket`. OPEN: value shape + deliveryState enum + requestInProgress semantics (open item #1b, coordinate with Monitor) | Namespace/key verified declarable in customer-account TOML (merchant-owned namespace supported; `$app` restriction only for app-owned). Code reads defensively (JSON.parse try/catch; malformed → hidden). Value-shape confirmation needed before visible-button dev-store validation |
| 1b | **Metafield VALUE SHAPE not confirmed** (`deliveryState` field names/enum values, `requestInProgress` semantics, JSON-encoded string) | Coordinate with Monitor; size the code to the recommended shape but parse defensively; flip to exact shape when confirmed
| 2 | ~~Exact TOML key for customer-account metafield declaration~~ **RESOLVED** | `[[extensions.metafields]]` (global) or `[[extensions.targeting.metafields]]` with `namespace`/`key`; verified against customer-account configuration docs (`namespace = "crystal"`, `key = "cambios_devoluciones_ticket"`) |
| 3 | Runtime confirmation that a TOML-declared order metafield hydrates `shopify.appMetafields` at `customer-account.order-status.cart-line-list.render-after`, and that `shopify.i18n.translate` resolves at that surface in a dev store | Dev-store verification task (scenario checklist §7); types say yes, runtime must confirm. |
| 4 | **Scope deviation vs delta spec**: gated entrypoint renders below the order lines (`order-status.cart-line-list.render-after`) instead of in the action menu / per order row; action-menu and index targets render nothing | **Signed off by stakeholder (2026-08-27):** cart-line-list placement accepted; per-row order-list entrypoint descoped/deferred as follow-up; list target fail-closed. Amend spec wording accordingly before implementation. |
| 5 | `include_config_on_deploy = true` deploys the app config (incl. new metafield definition) | Gate the `shopify.app.toml` change behind the value-shape confirmation; the `shopify.extension.toml` metafield REQUEST (read-only declaration) ships with the extension. If `shopify.app.toml` needs a definition block, it waits for #1b. |
| 6 | One-shot render vs signal subscription | Acceptable (gating inputs cannot change mid-page); optional `subscribe()` upgrade deferred. |
| 7 | Placement regression for existing users (button moves from action menu to below lines) | Communicate in release notes; rollback path §8. |

---

## 7. Testing / acceptance mapping

Static checks (static review covers the delta spec's "no `useOrder`/`useFulfillments`"
scenario): no hook imports, no hardcoded copy, all customer-visible strings via
`shopify.i18n.translate`.

| Delta spec scenario | Verification |
|---|---|
| Request in progress → entrypoint visible but disabled; trigger does not navigate | Dev store: order with `requestInProgress: true` + DELIVERED record → `<s-button disabled>` (no href); manual click does nothing |
| No in-progress marker → enabled (delivery only) | Record with `deliveryState: "DELIVERED"`, no/empty `requestInProgress` → enabled button, `extension://?orderId=` href navigates to full page |
| Metafield unreadable on a surface → not disabled for that reason | Record absent/malformed → entrypoint hidden (delivery not confirmed); never disabled by unreadable in-progress state |
| Localized copy EN / ES / fallback | Locale switch en→en.default, es→es.json, e.g. de→en.default fallback; no raw key or empty label |
| Delivery-state evaluation from target-provided data | Static: only `shopify.*` globals used; runtime: non-DELIVERED/absent record → hidden |
| Order identity at action-menu target | N/A (fail-closed module); order identity exercised at `order-status.cart-line-list.render-after` via `shopify.order.value.id` |
| Required data not available at a surface | Index + action-menu targets render nothing (dev-store + type evidence) |
| Index surface without per-order data → fails closed | Type-verified (StandardApi only); module renders nothing; documented at call site |
| Deep-link navigation | Click enabled button → full page shows resolved Order ID via `shopify.order.value.id`/`orderId` param |

Implementation-phase validation: run the skill's `search_docs.mjs`/`validate.mjs` with
`--target customer-account.order-status.cart-line-list.render-after` and `--version 2026-07`
for any generated code (delegated implementer must have shell access; unavailable in this
design env — noted as implementation constraint).

---

## 8. Rollout / rollback

1. Freeze Monitor contract (Open item #1). Optionally amend spec/scenarios per §6#4 first.
2. Extension-only change first (modules, targets, locales) — deploys inert (fail-closed,
   renders nothing).
3. Add the `shopify.app.toml` metafield definition (after freeze, and only if needed for merchant-owned namespace) and re-deploy
   (`include_config_on_deploy = true` pushes the definition).
4. Monitor begins writing the record; verify scenario checklist §7.
5. Rollback: revert `extensions/customer-account-order-actions/**` to the previous commit; prior behavior (unconditional
   action-menu button) is restored by reverting the TOML targeting.

## 9. Invariants check

- Extension renders entrypoints and navigates only — no orchestration logic. ✓ (pure reader)
- Monitor writes request-in-progress + delivery state; extension only reads. ✓
- No ERP/SAP/logistics integration in the extension layer. ✓
- API 2026-07; global `shopify.*` API only; no React hooks. ✓
- Valid targets only; `customer-account.order-status.action.render` never used
  (it does not exist). ✓