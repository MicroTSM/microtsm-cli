import { createApp } from 'vue'
import App from '@/App.vue'
import createVueMicroApp from '@microtsm/vue'
import router from '@/router'
import '@/assets/main.css'

export const { mount, unmount } = createVueMicroApp(createApp(App), {
  el: '#app',
  handleInstance(app, props) {
    app.use(router)
  },
})
