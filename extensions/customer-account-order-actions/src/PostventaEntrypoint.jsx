import '@shopify/ui-extensions/preact';

const MONITOR_METAFIELD_NAMESPACE = 'crystal';
const MONITOR_METAFIELD_KEY = 'cambios_devoluciones_ticket';
const DELIVERED = 'DELIVERED';

/**
 * Resolves the order GID at the order-status surface (OrderStatusApi & StandardApi).
 * Fail closed: no order context → null → the entrypoint renders nothing.
 */
function resolveOrderId() {
  return shopify.order?.value?.id ?? null;
}

/**
 * Reads the Monitor-owned order metafield record requested in shopify.extension.toml
 * (namespace crystal / key cambios_devoluciones_ticket, owner order). The value is a
 * JSON string written by Monitor; parse leniently — malformed or absent → null, which
 * evaluate() treats as "no record" (hidden, fail closed).
 */
function readMonitorRecord(orderId) {
  const entry = shopify.appMetafields.value.find(
    (candidate) =>
      candidate.target.type === 'order' &&
      candidate.target.id === orderId &&
      candidate.metafield.namespace === MONITOR_METAFIELD_NAMESPACE &&
      candidate.metafield.key === MONITOR_METAFIELD_KEY,
  );

  if (!entry) {
    return null;
  }

  const raw = entry.metafield.value;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Pure gating evaluation of the Monitor record (design D3):
 * - record absent/unreadable        → {visible: false}  (delivery not confirmed ⇒ fail closed)
 * - deliveryState !== 'DELIVERED'   → {visible: false}  (delivery not confirmed ⇒ fail closed)
 * - requestInProgress === true      → {visible: true, disabled: true}
 * - otherwise                       → {visible: true, disabled: false}
 */
function evaluate(record) {
  if (!record || typeof record !== 'object') {
    return {visible: false};
  }
  if (
    typeof record.deliveryState !== 'string' ||
    record.deliveryState.trim().toUpperCase() !== DELIVERED
  ) {
    return {visible: false};
  }
  if (record.requestInProgress === true) {
    return {visible: true, disabled: true};
  }
  return {visible: true, disabled: false};
}

export default function PostventaEntrypoint() {
  const orderId = resolveOrderId();
  if (!orderId) {
    return null;
  }

  const {visible, disabled} = evaluate(readMonitorRecord(orderId));
  if (!visible) {
    return null;
  }

  const label = shopify.i18n.translate('entrypoint.action');

  if (disabled) {
    // Visible but non-interactive: no href, cannot navigate (request in progress).
    return <s-button disabled>{label}</s-button>;
  }

  const href = `extension://?orderId=${encodeURIComponent(orderId)}`;
  return (
    <s-button href={href} variant="primary">
      {label}
    </s-button>
  );
}