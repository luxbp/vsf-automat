import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import i18n from '@vue-storefront/i18n'
import { ProductService } from '@vue-storefront/core/data-resolver/ProductService'

export default (store, appConfig) => {
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
}
