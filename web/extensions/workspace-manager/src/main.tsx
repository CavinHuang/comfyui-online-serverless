import React from "react";
import ReactDOM from "react-dom/client";

const topbar = document.createElement("div");
document.body.append(topbar);
import App from "./App.tsx";

ReactDOM.createRoot(topbar).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
