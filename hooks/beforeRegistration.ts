import { Logger } from '@vue-storefront/core/lib/logger'
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import { isServer } from '@vue-storefront/core/helpers';

export function beforeRegistration (appConfig, store) {
  if (!isServer && appConfig.automat && appConfig.automat.clientId) {
    let env = appConfig.automat.env || 'production'

    const deployments = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      document.body.appendChild(script)
      script.onload = resolve
      script.onerror = reject
      script.async = true
      script.src = 'https://cdn.automat-ai.com/' + appConfig.automat.clientId + '/deployments/' + env + '/index.js'
    })

    deployments.then(() => {
      EventBus.$emit('automat-cdn-loaded')
      Logger.debug('Automat.ai CDN loaded.')
    }).catch(e => {
      Logger.debug('Automat.ai CDN NOT loaded.')
    })

    const ash = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      document.body.appendChild(script)
      script.onload = resolve
      script.onerror = reject
      script.id = 'automat-ash-snippet'
      script.setAttribute('data-client-id', appConfig.automat.clientId)
      script.setAttribute('data-domain', appConfig.automat.domain)
      script.src = env === 'production'
        ? 'https://cdn.automat-ai.com/ash-telemetry/v2/snippet.js'
        : 'https://cdn.automat-ai.com/ash-telemetry-staging/v2/snippet.js'
    })

    ash.then(() => {
      EventBus.$emit('automat-ash-loaded')
      Logger.debug('Automat.ai ASH loaded.')
    }).catch(e => {
      Logger.debug('Automat.ai ASH NOT loaded.')
    })
  }
}
