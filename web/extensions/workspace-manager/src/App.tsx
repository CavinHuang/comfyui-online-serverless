import ReactDOM from "react-dom";
import "./App.css";
import WorkflowManagerTopbar from "./workflow-manager/WorkflowManagerTopbar";
import { Suspense, lazy, useEffect, useState } from "react";
import { app, waitForApp } from "./comfyapp";
import { ThemeProvider } from "./components/theme-provider";
import JobManagerTopbar from "./model-manager/JobManagerTopbar";
import { SWRConfig } from "swr";
import { swrLocalStorageProvider } from "./utils/swrFetcher";
import ProfileTopbar from "./user-manager/ProfileTopbar";
import { Toaster } from "@/components/ui/toaster";
import { ComfyUser, Workflow } from "./type/dbTypes";
import Flex from "./components/ui/Flex";
import { WorkspaceContext } from "./WorkspaceContext";
const ModelManagerTopbar = lazy(
  () => import("./model-manager/ModelManagerTopbar"),
);

const topMenu = document.getElementsByClassName("comfyui-menu").item(0);

const menuPush = document.getElementsByClassName("comfyui-menu-push").item(0);

// The element with title="View queue" has the same class (comfyui-queue-button) as queueButtonDiv, so you need to delete it first;
document.querySelector('[title="View queue"]')?.remove();

const queueButtonDiv = document
  .getElementsByClassName("comfyui-queue-button")
  .item(0);

const myQueueButtonDiv = document.createElement("div");
const leftMenu = document.createElement("div");
const middleMenu = document.createElement("div");

topMenu?.prepend(leftMenu);
menuPush?.append(middleMenu);
queueButtonDiv?.replaceWith(myQueueButtonDiv);

function App() {
  const [finishLoading, setFinishLoading] = useState(false);
  const [user, setUser] = useState<ComfyUser & { balance?: string }>();
  const [workflow, setWorkflow] = useState<
    | (Workflow & {
        path?: string;
      })
    | null
  >(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setFinishLoading(true);
      return;
    }
    waitForApp().then(() => {
      setFinishLoading(true);
      setWorkflow(app.dbWorkflow);
    });

    fetch("/api/user/getCurrentUser")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      });
  }, []);
  if (!finishLoading) {
    return null;
  }
  return (
    <SWRConfig value={{ provider: swrLocalStorageProvider }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <WorkspaceContext.Provider
          value={{ user: user || null, workflow, setWorkflow }}
        >
          <div className="tailwind dark">
            {leftMenu &&
              ReactDOM.createPortal(<WorkflowManagerTopbar />, leftMenu)}
            {middleMenu &&
              ReactDOM.createPortal(
                <div className="tailwind dark">
                  <Suspense fallback={null}>
                    <ModelManagerTopbar className="tailwind dark" />
                  </Suspense>
                </div>,
                middleMenu,
              )}
            {myQueueButtonDiv &&
              ReactDOM.createPortal(
                <Flex className="items-center gap-2">
                  <JobManagerTopbar />
                  <ProfileTopbar />
                </Flex>,
                myQueueButtonDiv,
              )}
          </div>
          <Toaster />
        </WorkspaceContext.Provider>
      </ThemeProvider>
    </SWRConfig>
  );
}

export default App;
