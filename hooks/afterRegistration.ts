import { Logger } from '@vue-storefront/core/lib/logger';
import { isServer } from '@vue-storefront/core/helpers';
import createProductData from '../helper/createProductData';
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'

declare const window

export function afterRegistration (appConfig, store) {
  if (!isServer && appConfig.automat && appConfig.automat.clientId) {
    store.subscribe(({ type, payload }, state) => {
      let env = appConfig.automat.env || 'production'
      if (type.endsWith('order/order/LAST_ORDER_CONFIRMATION') && env === 'production') {
        // load
        const load = new Promise((resolve, reject) => {
          const script = document.createElement('script')
          document.body.appendChild(script)
          script.onload = resolve
          script.onerror = reject
          script.async = true
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
