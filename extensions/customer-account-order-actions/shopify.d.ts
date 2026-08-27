import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/OrderStatusPostventa.jsx' {
  const shopify: import('@shopify/ui-extensions/customer-account.order-status.cart-line-list.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/PostventaNoop.jsx' {
  const shopify:
    | import('@shopify/ui-extensions/customer-account.order-index.block.render').Api
    | import('@shopify/ui-extensions/customer-account.order.action.menu-item.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/PostventaEntrypoint.jsx' {
  const shopify: import('@shopify/ui-extensions/customer-account.order-status.cart-line-list.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
