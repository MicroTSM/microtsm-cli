import { createApp } from 'vue'
import App from '@/App.vue'
import createVueMicroApp from '@microtsm/vue'
import router from '@/router'
import '@/assets/main.css'

// This function uses optional chaining and nullish coalescing operator.
// • Safari 14 (and later) supports this syntax natively.
// • Safari 11.1 does not support these operators.
// When targeting Safari 11.1, the Vite build step should transpile them into equivalent ES5/ES6 code.
export function getGreeting(person) {
  // If 'person' is null or undefined, person?.name yields undefined.
  // Then nullish coalescing (??) provides the fallback value 'Guest'.
  const name = person?.name ?? 'Guest'
  return `Hello, ${name}!`
}

export const { mount, unmount } = createVueMicroApp(createApp(App), {
  el: '#app',
  handleInstance(app, props) {
    app.use(router)
  },
})
