import ReactDOM from "react-dom";
import "./App.css";
import WorkflowManagerTopbar from "./workflow-manager/WorkflowManagerTopbar";
import { useEffect, useState } from "react";
import { waitForApp } from "./comfyapp";
import ModelManagerTopbar from "./model-manager/ModelManagerTopbar";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  const topMenu = document.getElementsByClassName("comfyui-menu").item(0);
  const leftMenu = document.createElement("div");
  const menuPush = document.getElementsByClassName("comfyui-menu-push").item(0);
  const middleMenu = document.createElement("div");
  topMenu?.prepend(leftMenu);
  menuPush?.append(middleMenu);
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="tailwind dark">
        {leftMenu && ReactDOM.createPortal(<WorkflowManagerTopbar />, leftMenu)}
        {middleMenu &&
          ReactDOM.createPortal(
            <div className="tailwind dark">
              <ModelManagerTopbar className="tailwind dark" />
            </div>,
            middleMenu,
          )}
      </div>
    </ThemeProvider>
  );
}

export default App;
