import { useContext, useState } from "react";
import { Button } from "./ui/button";
import { ShareWorkflowDialog } from "@/workflow-manager/ShareWorkflowDialog";
import { WorkspaceContext } from "@/WorkspaceContext";
import { EWorkflowPrivacy } from "@/type/dbTypes";
import { IconShare2 } from "@tabler/icons-react";

export default function ShareButton() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { workflow, setWorkflow } = useContext(WorkspaceContext);
  return (
    <>
      <Button
        size={"sm"}
        onClick={() => {
          if (!workflow) {
            alert("Please save your workflow first! 💾");
            return;
          }
          setShowShareDialog(true);
        }}
        style={{ alignItems: "center" }}
        variant={"secondary"}
      >
        {workflow?.privacy === EWorkflowPrivacy.UNLISTED ? (
          " 🔗"
        ) : workflow?.privacy === EWorkflowPrivacy.PUBLIC ? (
          " 🌐"
        ) : (
          <IconShare2 size={16} />
        )}
        <span className="ml-1">Share</span>
      </Button>
      {showShareDialog && workflow && (
        <ShareWorkflowDialog
          onClose={() => setShowShareDialog(false)}
          workflow={workflow}
          onShared={(workflow) => {
            setWorkflow(workflow);
          }}
        />
      )}
    </>
  );
}
