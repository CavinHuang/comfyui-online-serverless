
import { ComfyApp } from "./app.js";
import {serverNodeDefs} from '../../serverNodeDefs.js'
import { ComfyUI, $el } from "./ui.js";

const COMFYUI_CORE_EXTENSIONS = [
  "/extensions/core/clipspace.js",
  "/extensions/core/colorPalette.js",
  "/extensions/core/contextMenuFilter.js",
  "/extensions/core/dynamicPrompts.js",
  "/extensions/core/editAttention.js",
  "/extensions/core/groupNode.js",
  "/extensions/core/groupNodeManage.js",
  "/extensions/core/groupOptions.js",
  "/extensions/core/invertMenuScrolling.js",
  "/extensions/core/keybinds.js",
  "/extensions/core/linkRenderMode.js",
  "/extensions/core/maskeditor.js",
  "/extensions/core/nodeTemplates.js",
  "/extensions/core/noteNode.js",
  "/extensions/core/rerouteNode.js",
  "/extensions/core/saveImageExtraOutput.js",
  "/extensions/core/slotDefaults.js",
  "/extensions/core/snapToGrid.js",
  "/extensions/core/undoRedo.js",
  "/extensions/core/uploadImage.js",
  "/extensions/core/widgetInputs.js",
  "/extensions/dp.js",
]

export class ComfyEditWorkflowApp extends ComfyApp {
  extensionFilesPath = COMFYUI_CORE_EXTENSIONS;
  /** comfyspace cloud @type {string[]} */
  nodeDefs = serverNodeDefs;

  constructor() {
    super();  
		this.ui = new ComfyUI(this);
  }
  async setup() {
    await super.setup();
  }
}