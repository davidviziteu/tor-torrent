import { Component } from "solid-js";
import { Link, useRoutes, useLocation, useNavigate } from "solid-app-router";

import { routes } from "./routes";
import TopBar from "./components/TopBar";
import LeftBar from "./components/LeftBar";
const storageFile = './toranoData.json';


const App: Component = () => {
  const navigate = useNavigate();
  const Route = useRoutes(routes);
  let data
  try {
    window.fs.accessSync(storageFile, window.fs.constants.R_OK)
    data = JSON.parse(window.fs.readFileSync(storageFile, 'utf8'));
  } catch (error) {
    data = {}
    window.fs.writeFileSync(storageFile, JSON.stringify(data));
  }
  
  if (!data.trackerUrl) {
    navigate('/welcome')
  }
  else {
    //aici ar treubi incarcate datele
    navigate('/');
  }

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
