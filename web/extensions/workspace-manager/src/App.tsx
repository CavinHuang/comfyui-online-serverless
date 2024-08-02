import ReactDOM from "react-dom";
import "./App.css";
import WorkflowManagerTopbar from "./workflow-manager/WorkflowManagerTopbar";
import { useEffect, useState } from "react";
import { waitForApp } from "./comfyapp";
import ModelManagerTopbar from "./model-manager/ModelManagerTopbar";
import { ThemeProvider } from "./components/theme-provider";
import JobManagerTopbar from "./model-manager/JobManagerTopbar";
import { SWRConfig } from "swr";
import { swrLocalStorageProvider } from "./utils/swrFetcher";

function App() {
  console.log("🦄 workspace manager App");
  const topMenu = document.getElementsByClassName("comfyui-menu").item(0);
  if (!topMenu) {
    console.error("🦄❌❌ comfyui-menu not found");
  }
  const leftMenu = document.createElement("div");
  const menuPush = document.getElementsByClassName("comfyui-menu-push").item(0);
  console.log("🦄 menuPush", menuPush);
  const middleMenu = document.createElement("div");
  const queueButtonDiv = document
    .getElementsByClassName("comfyui-queue-button")
    .item(0);
  const myQueueButtonDiv = document.createElement("div");
  topMenu?.prepend(leftMenu);
  menuPush?.append(middleMenu);
  queueButtonDiv?.replaceWith(myQueueButtonDiv);
  const [finishLoading, setFinishLoading] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setFinishLoading(true);
      return;
    }
    waitForApp().then(() => {
      setFinishLoading(true);
    });
  }, []);
  if (!finishLoading) {
    return null;
  }
  return (
    <SWRConfig value={{ provider: swrLocalStorageProvider }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="tailwind dark">
          {leftMenu &&
            ReactDOM.createPortal(<WorkflowManagerTopbar />, leftMenu)}
          {middleMenu &&
            ReactDOM.createPortal(
              <div className="tailwind dark">
                <ModelManagerTopbar className="tailwind dark" />
              </div>,
              middleMenu,
            )}
          {myQueueButtonDiv &&
            ReactDOM.createPortal(
              <div className="tailwind dark">
                <JobManagerTopbar />
              </div>,
              myQueueButtonDiv,
            )}
        </div>
      </ThemeProvider>
    </SWRConfig>
  );
}

export default App;
