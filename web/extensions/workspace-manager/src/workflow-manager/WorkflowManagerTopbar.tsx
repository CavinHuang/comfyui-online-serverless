import { useEffect, useState } from "react";
import { app } from "../comfyapp";

export default function WorkflowManagerTopbar() {
  const [workflow, setWorkflow] = useState<{
    path?: string;
  } | null>(app.workflowManager.activeWorkflow);
  useEffect(() => {
    app.workflowManager.addEventListener("changeWorkflow", () => {
      console.log("🎛️changeWorkflow");
      setWorkflow(app.workflowManager?.activeWorkflow);
    });
  }, []);
  //   const workflow = app.workflowManager?.activeWorkflow();
  console.log("WorkflowManagerTopbar app workflow", workflow);

  return (
    <div className="workflow-manager-topbar">
      {workflow?.path && (
        <p style={{ padding: 0, margin: 0 }}>{workflow.path}</p>
      )}
    </div>
  );
}
