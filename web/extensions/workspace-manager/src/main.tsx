import React from "react";
import ReactDOM from "react-dom/client";

const topbar = document.createElement("div");
document.body.append(topbar);
import App from "./App";
import { injectCSS } from "./injectCss";

ReactDOM.createRoot(topbar).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

injectCSS("/web/extensions/workspace-manager/dist/input.css");
