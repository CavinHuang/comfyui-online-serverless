import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, app } from "@/comfyapp";
import { Workflow } from "@/type/dbTypes";
import { getCurWorkflowID } from "@/utils";

enum EWorkflowPrivacy {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
  UNLISTED = "UNLISTED",
}
export function ShareWorkflowDialog({ onClose }: { onClose: () => void }) {
  const [privacy, setPrivacy] = useState<EWorkflowPrivacy>(
    EWorkflowPrivacy.PRIVATE,
  );
  const [loading, setLoading] = useState(false);

  const onClickShare = async () => {
    const workflowID = getCurWorkflowID();
    if (!workflowID) {
      alert("❌Please Save your workflow first!");
      return;
    }
    setLoading(true);
    // share workflow
    const data = (await fetch("/api/shareWorkflow", {
      method: "POST",
      body: JSON.stringify({
        id: workflowID,
        privacy,
      }),
    }).then((res) => res.json())) as { data?: Workflow; error?: string };
    console.log(data);
    setLoading(false);
    console.log(data);
    if (data.error) {
      alert(`❌${data.error}`);
      return;
    }

    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        !open && onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right">Privacy</p>
            <Select
              value={privacy}
              onValueChange={(val) => setPrivacy(val as EWorkflowPrivacy)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EWorkflowPrivacy.PRIVATE}>
                  🔒 Private
                </SelectItem>
                <SelectItem value={EWorkflowPrivacy.UNLISTED}>
                  🔗 Anyone with this link can view
                </SelectItem>
                {/* <SelectItem value={EWorkflowPrivacy.PUBLIC}>
                  🌐 Public
                </SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={onClickShare}
            isLoading={loading}
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
