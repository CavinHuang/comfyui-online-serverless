import { useEffect, useState } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import {
  IconDeviceFloppy,
  IconFolder,
  IconPlus,
  IconShare2,
  IconTriangleInvertedFilled,
} from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import AppFormTopbar from "@/app-form-manager/AppFormTopbar";
import { ShareWorkflowDialog } from "./ShareWorkflowDialog";
import { Workflow } from "@/type/dbTypes";

export default function WorkflowManagerTopbar() {
  const [workflow, setWorkflow] = useState<
    | (Workflow & {
        path?: string;
      })
    | null
  >(app.dbWorkflow);
  const [showShareDialog, setShowShareDialog] = useState(false);
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
  const changeWorkflow = (workflow: Workflow | null) => {
    setWorkflow(workflow);
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    if (!workflow) {
      searchParams.delete("editWorkflowID");
      window.history.pushState({}, "ComfyUI Online Editor - Nodecafe", url);
      return;
    }
    searchParams.set("editWorkflowID", workflow.id);
    window.history.pushState({}, workflow.name ?? "Untitled workflow", url);
  };

  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <AppFormTopbar />
      <Button
        size={"sm"}
        onClick={() => setShowShareDialog(true)}
        variant={"secondary"}
      >
        <IconShare2 size={18} />
      </Button>
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

      {/* <Button
        onClick={() => {
          const workflowName = prompt(
            "Save workflow as:",
            app.workflowManager?.activeWorkflow?.name ?? "Untitled workflow",
          );
          if (!workflowName) return;
          app.workflowManager.saveWorkflow(workflowName);
        }}
        size={"sm"}
      >
        <IconDeviceFloppy size={18} />
      </Button>
      <Button
        size={"sm"}
        onClick={() => {
          changeWorkflow(null);
        }}
      >
        <IconPlus size={18} />
      </Button> */}
      {showShareDialog && (
        <ShareWorkflowDialog onClose={() => setShowShareDialog(false)} />
      )}
    </Flex>
  );
}
