import {
  LOAD_ERROR,
  addErrorHandler,
  getAppStatus,
  navigateToUrl,
  registerApplication,
  start,
  unloadApplication,
} from 'single-spa';
import {
  constructApplications,
  constructLayoutEngine,
  constructRoutes,
} from 'single-spa-layout';
import microfrontendLayout from './microfrontend-layout.html';

async function boostrap() {
  const navbarChannel = new BroadcastChannel('navbarChannel');
  // const appErrorsChannel =  new BroadcastChannel("appErrorsChannel");

  const navbarRoutes = [];
  const appErrors = [];

  const routes = constructRoutes(microfrontendLayout);
  const applications = constructApplications({
    routes,
    loadApp({ name }) {
      return System.import(name);
    },
  });
  const layoutEngine = constructLayoutEngine({ routes, applications });

  applications.forEach((app) =>
    registerApplication({ ...app, customProps: {} })
  );

  // await Promise.all(["@mfe-lib/styleguide", "@microfrontend-navbar"]);

  (async function () {
    for (const [_, app] of applications.entries()) {
      try {
        const module = await System.import(app.name);

        if (module.routes) {
          navbarRoutes.push(module.routes);
        }
      } catch (error) {
        console.log(error);
        const [_, erroUrl] = error?.message?.split('//');
        const [hostname] = erroUrl?.split('.');
        const idx = hostname?.lastIndexOf('-');
        const appName = hostname?.substring(0, idx);
        console.log('Error loading: ', appName);
        // appErrors.push(appName);
      }
    }
  })().then(() => {
    navbarChannel.postMessage(navbarRoutes);
    // In case you want to show the errors in the UI (e.g. navbar)
    // appErrorsChannel.postMessage(appErrors);
  });

  layoutEngine.activate();

  addErrorHandler(async (err) => {
    console.log(`Erro SingleSpa ${err.appOrParcelName}: ${err}`);

    if (getAppStatus(err.appOrParcelName) === LOAD_ERROR) {
      System.delete(System.resolve(err.appOrParcelName));

      setTimeout(() => {
        navigateToUrl(`/not-found?app=${err.appOrParcelName}`);
        unloadApplication(err.appOrParcelName);
      }, 0);
    }
  });

  start();
}

boostrap();
