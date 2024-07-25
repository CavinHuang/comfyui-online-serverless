import ReactDOM from "react-dom";
import "./App.css";

function App() {
  console.log("App!!😂");
  const topMenu = document.getElementsByClassName("comfyui-menu").item(0);
  const leftMenu = document.createElement("div");
  topMenu?.prepend(leftMenu);

  return (
    <div className="workspace-manager">
      {leftMenu && ReactDOM.createPortal(<h1>left + React</h1>, leftMenu)}
    </div>
  );
}

export default App;
