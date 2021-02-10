import { afterRegistration } from './hooks/afterRegistration'
import { beforeRegistration } from './hooks/beforeRegistration'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import { StorefrontModule } from '@vue-storefront/core/lib/modules'


const KEY = 'automat'

const automatStore = {
  namespaced: true,
  state: {
    key: null
  }
}

export const AutomatModule: StorefrontModule = function ({ store, router, appConfig }) {
  StorageManager.init(KEY)
  store.registerModule(KEY, automatStore)
  afterRegistration(appConfig, store)
  beforeRegistration(appConfig, store)
  const AutomatConversationPage = () => import(/* webpackChunkName: "vsf-automat" */ './pages/Conversation.vue')
  router.addRoutes([
    {
      name: 'conversation',
      path: '/conversation',
      component: AutomatConversationPage
    }
  ])
}
