# Monitor Contract Notes

## Purpose

Define integration expectations between extension and Monitor Omnicanal.

## Contract expectations

- Explicit DTO mapping for request creation and status lookup.
- Correlation id propagation per user operation.
- Idempotency support for submit actions.
- Structured error mapping for UI-safe handling.

## Error and retry guidance

- Distinguish retryable failures (timeout/network/transient) from terminal business failures.
- Avoid duplicate request creation on retries.

## Security boundary

- Monitor-side ownership checks are mandatory in addition to extension checks.
- Sensitive fields must be minimized and protected in logs.
