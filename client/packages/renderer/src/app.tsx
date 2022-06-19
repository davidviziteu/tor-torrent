import { Component, createSignal } from "solid-js";
import { Link, useRoutes, useLocation, useNavigate } from "solid-app-router";
import fetchBackendData from './routines'
import routeAccordingly from "./routeAccordingly";
import { routes } from "./routes";
import TopBar from "./components/TopBar";
import LeftBar from "./components/LeftBar";
const storageFile = './toranoData.json';


const App: Component = () => {
  const Route = useRoutes(routes);
  const navigate = useNavigate();

  //readfilesync
  let storageFile = window.cwd + `\\.data${window.backend_port}.json`
  if (!window.fs.existsSync(storageFile)) {
    //@ts-ignore
    window.data = {}
    navigate('/welcome');
    console.log(`${storageFile} not found`);
  }
  else {
    try {

      console.log(`${storageFile} found`);
      let fsdata = window.fs.readFileSync(storageFile, 'utf8')//citeste aiurea
      //@ts-ignore
      window.data = JSON.parse(fsdata)
    } catch (error) {
      console.log(`catch. error: ${JSON.stringify(error)}`);
      navigate('/welcome');
    }
  }
  const [getError, setError] = createSignal('')
  window.setError = setError
  window.getError = getError
  window.backend_port = 10000
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
