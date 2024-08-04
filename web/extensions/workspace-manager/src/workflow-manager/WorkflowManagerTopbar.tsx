import { useEffect, useState } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import { IconFolder, IconTriangleInvertedFilled } from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import AppFormTopbar from "@/app-form-manager/AppFormTopbar";

export default function WorkflowManagerTopbar() {
  const [workflow, setWorkflow] = useState<{
    path?: string;
    name: string;
  } | null>(app.workflowManager.activeWorkflow);

  useEffect(() => {
    window.parent.postMessage(
      {
        type: "set_workflow",
        data: app.dbWorkflow,
      },
      "*",
    );
    app?.workflowManager?.addEventListener("changeWorkflow", () => {
      setWorkflow(app.workflowManager?.activeWorkflow);
    });
  }, []);

  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <AppFormTopbar />
      <Button
        size={"sm"}
        className="gap-1"
        onClick={() => {
          window.parent.postMessage(
            {
              type: "show_my_workflows",
            },
            "*",
          );
        }}
      >
        <IconFolder size={18} />
        <IconTriangleInvertedFilled size={9} />
      </Button>

      {workflow?.path ? (
        <p style={{ padding: 0, margin: 0 }}>{workflow.name}</p>
      ) : (
        <p
          className="text-muted-foreground italic"
          style={{ padding: 0, margin: 0 }}
        >
          Unsaved
        </p>
      )}
    </Flex>
  );
}
