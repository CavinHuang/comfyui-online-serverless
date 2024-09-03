import { createContext } from "react";
import { ComfyUser, Workflow } from "./type/dbTypes";

export const WorkspaceContext = createContext<{
  user: (ComfyUser & { balance?: string }) | null;
  workflow: Workflow | null;
  setWorkflow: (workflow: Workflow | null) => void;
}>({
  user: null,
  workflow: null,
  setWorkflow: () => {},
});
