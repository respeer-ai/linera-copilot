import { createApp } from 'vue'
import App from './App.vue'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Quasar, {
  plugins: {},
})

app.mount('#app')
