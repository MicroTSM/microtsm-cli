import { MicroTSMRootApp } from 'microtsm';
import layout from './layout.html?raw';
// @ts-ignore
import { defineComponent } from 'vue';

alert(defineComponent);

// Initialize the MicroTSM app with the required layout
const App = new MicroTSMRootApp({ layout });

/** 🔹 Register Lifecycle Hooks */
// TODO: Add lifecycle hooks before load
App.onLaunch(() => console.log('✅ App has launched'));
App.onBeforeDestroy(() => console.log('🛑 App is preparing to shut down'));
App.onDestroy(() => console.log('🔥 App destroyed'));

console.log('registering MicroApps', App.registeredMicroApps);

App.configureMicroApps((microApp) => {
  if (microApp.name === '@microtsm/navbar') {
    microApp.shouldMount = ({ currentRoute }) => {
      console.log('🧭 Checking if navbar should be mounted');
      return currentRoute !== '/';
    };
  }
});

/** 🔹 Register Middleware for Navigation */
App.useRouteMiddleware(async (route) => {
  console.log(`🧭 Checking access for ${route.pathname}`);

  const protectedRoute = route.pathname.startsWith('/dashboard');
  const userLoggedIn = !!localStorage.getItem('userToken');

  if (protectedRoute && !userLoggedIn) {
    console.warn('🚫 Access denied! Redirecting to login.');
    window.location.href = '/login';
    return false;
  }

  console.log('✅ Access granted!');
  return true;
});

App.useRouteMiddleware((route) => {
  console.log(`📊 Logging page view: ${route.pathname}`);
  return true;
});

/*
 * 🔹 Start the Engine & Observe Navigation
 *
 */

App.startEngine().launch(); // Methods can be chained or called individually, as below.
// App.startEngine();
// App.launch()
