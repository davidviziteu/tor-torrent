import { Component } from "solid-js";
import { Link, useRoutes, useLocation, useNavigate } from "solid-app-router";

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
      console.log(`reading..`);
      let fsdata = window.fs.readFileSync(storageFile, 'utf8')//citeste aiurea
      console.log(`parsing: ${fsdata}`);
      //@ts-ignore
      window.data = JSON.parse(fsdata);
      if (!window.data.trackerAddress) {
        console.log(`${storageFile} tracker null `);
        navigate('/welcome');
      }
      else{
        navigate('/')
        console.log(`${storageFile} tracker ok `);
        }
    } catch (error) {
      console.log(`catch. error: ${JSON.stringify(error)}`);
      navigate('/welcome');
    }
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
