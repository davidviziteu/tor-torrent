import { Component } from "solid-js";
import { Link, useRoutes, useLocation } from "solid-app-router";

import { routes } from "./routes";
import TopBar from "./components/TopBar";
import LeftBar from "./components/LeftBar";
const App: Component = () => {
  const location = useLocation();
  const Route = useRoutes(routes);

  return (
    <>
      <TopBar />
      <main>
        <Route />
      </main>
    </>
  );
};

export default App;
