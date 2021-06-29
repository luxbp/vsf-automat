import { Logger } from '@vue-storefront/core/lib/logger';
import createProductData from '../helper/createProductData';
import dollarsToCents from '../helper/dollarsToCents'
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import { ORDER_LAST_ORDER_WITH_CONFIRMATION } from '@vue-storefront/core/modules/order/store/mutation-types'

declare const window

export default (store, appConfig) => store.subscribe(({ type, payload }, state) => {
  if (type.endsWith(ORDER_LAST_ORDER_WITH_CONFIRMATION)) {
    Logger.debug('Automat.ai post purchase tracking loaded.')
    window.automatAshV2DataLayer = window.automatAshV2DataLayer || [];

    const products = payload.order.products.map((product, index) => createProductData(product, {position: index}));
    const orderId = payload.confirmation.backendOrderId;

    store.dispatch(
      'user/getOrdersHistory',
      { refresh: true, useCache: false }
    ).then(() => {
      const orderHistory = state.user.orders_history;
      const cartHistory = Object.assign({}, state.cart);

      // in the event this is empty, tag manager should pull order and tax from CartStateSubscriber
      let data: Record<any, any> = {};

      if (!orderHistory && cartHistory.platformTotals) {
        data.type = 'Purchase/v1'
        data.products = products
        data.discountCode = cartHistory.platformTotals.coupon_code || null
        data.total = dollarsToCents(cartHistory.platformTotals.grand_total)
        data.subTotal = dollarsToCents(cartHistory.platformTotals.subtotal)
      } else {
        const order = orderHistory.items.find((order) => (order['entity_id'] || '').toString() === orderId);
        data.type = 'Purchase/v1'
        data.products = products
        data.discountCode = order.coupon_code || null
        data.total = dollarsToCents(order.grand_total)
        data.subTotal = dollarsToCents(order.subtotal)
      }
      window.automatAshV2DataLayer.push(data)
      EventBus.$emit('automat-post-purchase', data)
    }).catch(() => {
      Logger.debug('Automat.ai unable to push to data layer.')
    })
  }
})
