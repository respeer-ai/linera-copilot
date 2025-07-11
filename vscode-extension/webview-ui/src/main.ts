import { createApp } from 'vue'
import App from './App.vue'
import { Quasar, Notify } from 'quasar'
import { createPinia } from 'pinia'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import 'github-markdown-css/github-markdown-light.css'
import quasarIconSet from 'quasar/icon-set/material-icons'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Quasar, {
  plugins: { Notify },
  iconSet: quasarIconSet,
})

app.mount('#app')