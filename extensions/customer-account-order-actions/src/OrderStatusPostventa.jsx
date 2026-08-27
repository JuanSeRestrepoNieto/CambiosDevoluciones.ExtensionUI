import '@shopify/ui-extensions/preact';
import {render} from 'preact';

import PostventaEntrypoint from './PostventaEntrypoint.jsx';

export default async () => {
  render(<PostventaEntrypoint />, document.body);
};