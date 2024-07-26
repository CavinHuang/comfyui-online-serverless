import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const topbar = document.createElement("div");
document.body.append(topbar);
import App from "./App";

ReactDOM.createRoot(topbar).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
