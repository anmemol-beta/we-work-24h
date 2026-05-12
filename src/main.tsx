import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Keep <html data-theme> in sync with the OS/browser theme as it changes.
const mq = matchMedia("(prefers-color-scheme: dark)");
const applySystemTheme = (matches: boolean) => {
  document.documentElement.setAttribute("data-theme", matches ? "dark" : "light");
};
applySystemTheme(mq.matches);
mq.addEventListener("change", (e) => applySystemTheme(e.matches));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
