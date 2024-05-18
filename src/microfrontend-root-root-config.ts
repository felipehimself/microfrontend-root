import { registerApplication, start } from "single-spa";
import {
  constructApplications,
  constructLayoutEngine,
  constructRoutes,
} from "single-spa-layout";
import microfrontendLayout from "./microfrontend-layout.html";

async function boostrap() {
  const navbarChannel = new BroadcastChannel("navbarChannel");
  const navbarRoutes = [];

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

  await Promise.all(["@mfe-lib/styleguide", "@microfrontend-navbar"]);

  (async function () {
    for (const [_, app] of applications.entries()) {
      try {
        const module = await System.import(app.name);
        if (module.navbarRoutes) {
          navbarRoutes.push(module.navbarRoutes);

          const teste = {
            appName: "Reports",
            appIcon: "/streaming/streaming-nav-icon.svg",
            routes: [
              {
                menuName: "General",
                menuChildren: [
                  {
                    submenuName: "General",
                    path: "stock/stock/stock",
                  },
                ],
              },
              {
                menuName: "Internal",
                menuChildren: [
                  {
                    submenuName: "Internal",
                    path: "Sales/Sales/Sales",
                  },
                ],
              },
            ],
          };
          navbarRoutes.push(teste);
        }
      } catch (error) {
        console.log(error);
        const [_, erroUrl] = error?.message?.split("//");
        const [hostname] = erroUrl?.split(".");
        const idx = hostname?.lastIndexOf("-");
        const appName = hostname?.substring(0, idx);
        // loadAppsErros.push(appName);
      }
    }
  })().then(() => {
    navbarChannel.postMessage(navbarRoutes);
  });

  layoutEngine.activate();
  start();
}

boostrap();
