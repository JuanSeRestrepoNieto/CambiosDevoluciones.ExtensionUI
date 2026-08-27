import '@shopify/ui-extensions/preact';
import {render} from 'preact';

export default async () => {
  render(<OrderFullPage />, document.body);
};

function OrderFullPage() {
  const currentUrl = new URL(shopify.navigation.currentEntry.url);
  const orderIdFromRoute = currentUrl.searchParams.get('orderId');
  const orderIdFromTarget = shopify.order?.value?.id;

  const resolvedOrderId = orderIdFromTarget || orderIdFromRoute || '';
  const hasOrderContext = typeof resolvedOrderId === 'string' && resolvedOrderId.length > 0;

  if (!hasOrderContext) {
    return (
      <s-page heading="Order request">
        <s-banner tone="critical" heading="Order context is unavailable">
          We could not determine which order you want to manage.
        </s-banner>
      </s-page>
    );
  }

  return (
    <s-page heading="Order request">
      <s-section heading="Order context">
        <s-stack direction="block" gap="base">
          <s-text type="strong">Order ID</s-text>
          <s-text>{resolvedOrderId}</s-text>
          <s-paragraph tone="subdued">
            This page only accepts routed order context. Any order-affecting action must validate customer entitlement before execution.
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}
