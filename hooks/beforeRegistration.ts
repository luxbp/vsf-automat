import { Logger } from '@vue-storefront/core/lib/logger'
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import { isServer } from '@vue-storefront/core/helpers';

export function beforeRegistration (appConfig, store) {
  if (!isServer && appConfig.automat && appConfig.automat.clientId) {
    let env = appConfig.automat.env || 'production'

    const load = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      document.body.appendChild(script)
      script.onload = resolve
      script.onerror = reject
      script.async = true
      script.src = 'https://cdn.automat-ai.com/' + appConfig.automat.clientId + '/deployments/' + env + '/index.js'
    })

    load.then(() => {
      EventBus.$emit('automat-loaded')
      Logger.debug('Automat.ai loaded.')
    }).catch(e => {
      Logger.debug('Automat.ai NOT loaded.')
    })
  }
}
