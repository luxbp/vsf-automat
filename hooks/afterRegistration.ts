import { Logger } from '@vue-storefront/core/lib/logger';
import { isServer } from '@vue-storefront/core/helpers';
import createProductData from '../helper/createProductData';
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import i18n from '@vue-storefront/i18n'
import { ProductService } from '@vue-storefront/core/data-resolver/ProductService'

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
      if (type.endsWith('order/order/LAST_ORDER_CONFIRMATION') && env === 'production') {
        // load
        const load = new Promise((resolve, reject) => {
          const script = document.createElement('script')
          document.body.appendChild(script)
          script.onload = resolve
          script.onerror = reject
          script.src = 'https://ash-telemetry.production.bot-brain.com/snippet/v0.js?' + appConfig.automat.clientId
        })

        load.then(() => {
          Logger.debug('Automat.ai post purchase tracking loaded.')
          const products = payload.order.products.map((product, index) => createProductData(product, { position: index }));

          window.automatDataLayer = window.automatDataLayer || []

          const data = { type: 'purchase', products: products, currency: 'USD' }
          window.automatDataLayer.push(data)
          EventBus.$emit('automat-post-purchase', data)
        }).catch(e => {
          Logger.debug('Automat.ai unable to push to data layer.')
        })
      }
    })
  }
}
