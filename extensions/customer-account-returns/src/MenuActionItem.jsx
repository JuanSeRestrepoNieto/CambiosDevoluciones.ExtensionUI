import '@shopify/ui-extensions/preact';
import { render } from 'preact';

export default async () => {
  render(<MenuActionExtension />, document.body);
};

function MenuActionExtension() {
  function handleNavigate() {
    // Navigate to the order-specific full-page extension
    // The shopify global provides the navigation object
    if (typeof shopify !== 'undefined' && shopify.navigation) {
      shopify.navigation.navigate('extension://customer-account-returns');
    } else {
      console.error('Shopify API is not available in the current context.');
    }
  }

  return (
    <s-button onClick={handleNavigate}>
      Cambios y devoluciones
    </s-button>
  );
}
