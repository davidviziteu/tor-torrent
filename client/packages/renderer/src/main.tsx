/* @refresh reload */
import { onMount } from "solid-js";
import { render } from "solid-js/web";
import { Router, createIntegration } from "solid-app-router";
import App from "./app";

function bindEvent(target: EventTarget, type: string, handler: EventListener) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

function electronIntegration() {

  return createIntegration(
    () => window.location.hash.slice(1),
    ({ value, scroll }) => {
      if (value.includes("index.html#")) {
        value = new URL("file://" + value).hash;
      }
      window.location.hash = value.startsWith("/#/") ? value.slice(2) : value;
      if (scroll) {
        window.scrollTo(0, 0);
      }
    },
    (notify) => bindEvent(window, "hashchange", () => notify()),
    {
      go: (delta) => window.history.go(delta),
      renderPath: (path) => `#${path}`,
    }
  );
}

render(() => {
  onMount(async () => {
    window.backend_port = window._backend_port
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.removeLoading();
  });
  
  return (
    <Router source={electronIntegration()}>
      <App />
    </Router>
  );
}, document.getElementById("root") as HTMLElement);

//wake up backend