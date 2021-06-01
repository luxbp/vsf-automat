import { Logger } from '@vue-storefront/core/lib/logger';
import { isServer } from '@vue-storefront/core/helpers';
import createProductData from '../helper/createProductData';
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import i18n from '@vue-storefront/i18n'
import { ProductService } from '@vue-storefront/core/data-resolver/ProductService'
import { ORDER_LAST_ORDER_WITH_CONFIRMATION } from '@vue-storefront/core/modules/order/store/mutation-types'

declare const window

export function afterRegistration (appConfig, store) {
  if (!isServer && appConfig.automat && appConfig.automat.clientId) {

    let notifyUser = (notificationData) => {
      if (notificationData.type === 'success') {
        store.dispatch('ui/toggleMicrocart')
      } else {
        store.dispatch('notification/spawnNotification', notificationData, { root: true })
      }
    }

    window.addEventListener('automat/addProductsToCartRequest', async (event: CustomEvent) => {
      let products = event.detail || []

      if (products && products.length <= 0) {
        return
      }

      EventBus.$emit('notification-progress-start', i18n.t('Please wait a moment ...'))
      const productsToAdd = []
      for (const item of products) {
        const product = await ProductService.getProductByKey({
          options: { sku: item.sku },
          key: 'sku',
          skipCache: false
        })

        if (product) {
          product.qty = item.quantity || 1
          productsToAdd.push(product)
        } else {
          EventBus.$emit('notification-progress-stop', {})
          notifyUser({
            type: 'error',
            message: i18n.t('Unable to add to cart, invalid product: ') + ' ' + item.sku,
            action1: { label: i18n.t('OK') },
          })
        }
      }

      if (productsToAdd.length === 0) {
        EventBus.$emit('notification-progress-stop', {})
        return
      }

      let diffLog = await store.dispatch('cart/addItems', { productsToAdd })
      EventBus.$emit('notification-progress-stop', {})

      if (diffLog) {
        if (diffLog.clientNotifications && diffLog.clientNotifications.length > 0) {
          diffLog.clientNotifications.forEach(notificationData => {
            notifyUser(notificationData)
          })
        }
      } else {
        notifyUser({
          type: 'success',
          message: i18n.t('Your products have been added to the cart!'),
          action1: { label: i18n.t('OK') },
          action2: null
        })
      }
      return diffLog
    })

    store.subscribe(({ type, payload }, state) => {
      let env = appConfig.automat.env || 'production'
      if (type.endsWith(ORDER_LAST_ORDER_WITH_CONFIRMATION)) {
        // load
        const load = new Promise((resolve, reject) => {
          const script = document.createElement('script')
          document.body.appendChild(script)
          script.onload = resolve
          script.onerror = reject
          script.id = 'automat-ash-snippet'
          script.setAttribute('data-client-id', appConfig.automat.clientId)
          script.src = env === 'production'
            ? 'https://cdn.automat-ai.com/ash-telemetry/v2/snippet.js'
            : 'https://cdn.automat-ai.com/ash-telemetry-staging/v2/snippet.js'
        })

        load.then(() => {
          Logger.debug('Automat.ai post purchase tracking loaded.')
          window.automatAshV2DataLayer = window.automatAshV2DataLayer || [];

          const products = payload.order.products.map((product, index) => createProductData(product, { position: index }));

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
              data.discountCode = cartHistory.platformTotals.coupon_code
              data.total = cartHistory.platformTotals.grand_total
              data.subtotal = cartHistory.platformTotals.subtotal
            } else {
              const orderId = payload.confirmation.backendOrderId;
              const order = orderHistory.items.find((order) => (order['entity_id'] || '').toString() === orderId);
              data.type = 'Purchase/v1'
              data.products = products
              data.discountCode = order.coupon_code
              data.total = order.grand_total
              data.subtotal = order.subtotal
            }
            window.automatAshV2DataLayer.push(data)
            EventBus.$emit('automat-post-purchase', data)
          })
        }).catch(e => {
          Logger.debug('Automat.ai unable to push to data layer.')
        })
      }
    })
  }
}
