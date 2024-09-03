import { useContext, useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import {
  IconFolder,
  IconPlus,
  IconTriangleInvertedFilled,
  IconCategory,
} from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import AppFormTopbar from "@/app-form-manager/AppFormTopbar";
import { getCurWorkflowID, setCurWorkflowID } from "@/utils";
import SaveButton from "./SaveButton";
import { WorkspaceContext } from "@/WorkspaceContext";

export default function WorkflowManagerTopbar() {
  const { setWorkflow, workflow } = useContext(WorkspaceContext);
  useEffect(() => {
    window.parent.postMessage(
      {
        type: "set_workflow",
        data: app.dbWorkflow,
      },
      "*",
    );
    api.addEventListener("workflowIDChanged", () => {
      const workflowID = getCurWorkflowID();
      console.log("🔗workflowIDChanged", workflowID);
      if (!workflowID) {
        setWorkflow(null);
        return;
      }
      fetch("/api/workflow/getWorkflow?id=" + workflowID)
        .then((res) => res.json())
        .then((data) => {
          app.dbWorkflow = data.data;
          setWorkflow(app.dbWorkflow);
        });
    });
  }, []);

  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      {workflow && (
        <Button
          size={"sm"}
          className="gap-1"
          variant={"secondary"}
          onClick={() => {
            window.parent.postMessage(
              {
                type: "show_overview",
              },
              "*",
            );
          }}
        >
          <IconCategory size={18} />
          Overview
        </Button>
      )}

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
      <Button
        size={"sm"}
        variant={"secondary"}
        onClick={() => {
          const confirm = window.confirm(
            "Are you sure you want to create a new workflow? Your unsaved changes will be lost.",
          );
          if (!confirm) return;
          setCurWorkflowID(null);
          app.loadGraphData();
        }}
      >
        <IconPlus size={18} />
      </Button>
      {workflow?.name ? (
        <p className="p-0 m-0 font-bold text-lg text-[1.05rem]">
          {workflow.name}
        </p>
      ) : (
        <p
          className="text-muted-foreground italic"
          style={{ padding: 0, margin: 0 }}
        >
          Unsaved
        </p>
      )}
      <SaveButton />
    </Flex>
  );
}
