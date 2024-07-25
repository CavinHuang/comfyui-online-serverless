//@ts-ignore
import { api } from "../../scripts/api.js";

setTimeout(() => {
  import(api.api_base + "/extensions/workspace-manager/dist/input.js");
}, 1);
