import { createContext } from "react";
import { ComfyUser } from "./type/dbTypes";

export const WorkspaceContext = createContext<{
  user: (ComfyUser & { balance?: string }) | null;
}>({
  user: null,
});
