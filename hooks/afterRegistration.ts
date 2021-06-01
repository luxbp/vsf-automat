import { isServer } from '@vue-storefront/core/helpers';
import TransactionSubscriber from '../subscribers/TransactionSubscriber';
import AddToCartListener from '../listeners/AddToCartListener';

export function afterRegistration (appConfig, store) {
  if (!isServer && appConfig.automat && appConfig.automat.clientId) {
    // Register Subscribers
    [TransactionSubscriber].map(register => register(store, appConfig));

    // Register Listeners
    [AddToCartListener].map(register => register(store, appConfig));
  }
}
