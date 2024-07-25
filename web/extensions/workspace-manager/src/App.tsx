import ReactDOM from "react-dom";
import "./App.css";
import WorkflowManagerTopbar from "./workflow-manager/WorkflowManagerTopbar";
import { useEffect, useState } from "react";
import { waitForApp } from "./comfyapp";

function App() {
  console.log("App!!😂");
  const topMenu = document.getElementsByClassName("comfyui-menu").item(0);
  const leftMenu = document.createElement("div");
  topMenu?.prepend(leftMenu);
  const [finishLoading, setFinishLoading] = useState(false);
  useEffect(() => {
    waitForApp().then(() => {
      setFinishLoading(true);
    });
  }, []);
  if (!finishLoading) {
    return null;
  }
  return (
    <div className="workspace-manager">
      {leftMenu && ReactDOM.createPortal(<WorkflowManagerTopbar />, leftMenu)}
    </div>
  );
}

export default App;
