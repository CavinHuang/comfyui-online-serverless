import { useEffect, useState } from "react";
import { app } from "../comfyapp";

export default function WorkflowManagerTopbar() {
  const [workflow, setWorkflow] = useState<{
    path?: string;
    name: string;
  } | null>(app.workflowManager.activeWorkflow);
  useEffect(() => {
    app.workflowManager.addEventListener("changeWorkflow", () => {
      setWorkflow(app.workflowManager?.activeWorkflow);
    });
  }, []);

  return (
    <div className="workflow-manager-topbar">
      {workflow?.path && (
        <p style={{ padding: 0, margin: 0 }}>{workflow.name}</p>
      )}
    </div>
  );
}
