import { registerApplication, start } from 'single-spa';
import {
  constructApplications,
  constructLayoutEngine,
  constructRoutes,
} from 'single-spa-layout';
import microfrontendLayout from './microfrontend-layout.html';

async function boostrap() {
  // const navbar = await System.import("@microfrontend-navbar");
  // registerApplication({
  //   name: "@microfrontend-navbar",
  //   app: navbar.default,
  //   activeWhen: ["/"],
  // });

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

  await Promise.all(['@mfe-lib/styleguide', '@microfrontend-navbar']);

  layoutEngine.activate();
  start();
}

boostrap();
