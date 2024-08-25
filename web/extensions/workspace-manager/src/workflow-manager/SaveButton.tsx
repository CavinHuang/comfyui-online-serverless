import { useEffect, useContext } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { IconDeviceFloppy, IconChevronDown } from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import { downloadBlob, getCurWorkflowID } from "@/utils";
import { saveWorkflow } from "./workflowAPI";
import { WorkspaceContext } from "@/WorkspaceContext";

export default function SaveButton() {
  const { user } = useContext(WorkspaceContext);
  const { toast } = useToast();

  const onSave = async (isSaveAs = false) => {
    let fileName = app?.workflowManager?.activeWorkflow?.name;

    const noWriteAccess = !isSaveAs && user?.id !== app.dbWorkflow.authorID;

    if (isSaveAs || !getCurWorkflowID() || noWriteAccess) {
      fileName = prompt(
        noWriteAccess
          ? "No write access, do you want to save as copy?"
          : "Save workflow as:",
        fileName,
      );
      if (!fileName) return;
    }

    const res = await saveWorkflow({
      name: fileName,
      isSaveAs: isSaveAs || noWriteAccess,
    });
    if (res?.id) {
      toast({
        title: "Saved successfully",
      });
    }
  };

  const onExport = async () => {
    let fileName = "workflow";
    if (app.workflowManager.activeWorkflow?.path) {
      fileName = app.workflowManager.activeWorkflow.name;
    }

    if (app.ui.settings.getSettingValue("Comfy.PromptFilename", true)) {
      let promptRes = prompt("Save workflow as:", fileName!);
      if (!promptRes) return;
      if (!promptRes.toLowerCase().endsWith(".json")) {
        promptRes += ".json";
      }
      fileName = promptRes;
    }

    const p = await app.graphToPrompt();
    const json = JSON.stringify(p.workflow, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    if (!fileName) return;
    downloadBlob(fileName, blob);
  };

  useEffect(() => {
    // Hide comfyui's own save button;
    const comfyuiSaveElement = document.querySelector(
      '[title="Save the current workflow"]',
    )?.parentElement?.parentElement;

    if (comfyuiSaveElement) {
      comfyuiSaveElement.style.display = "none";
    }
  }, []);

  return (
    <Flex className="items-center gap-px">
      <Button
        size={"sm"}
        className="rounded"
        variant={"secondary"}
        onClick={() => {
          onSave();
        }}
      >
        <IconDeviceFloppy color="#fff" size={18} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={"sm"}
            className="px-0.5 rounded hover:bg-primary/20"
            variant={"secondary"}
            style={{ boxShadow: "none" }}
          >
            <IconChevronDown color="#fff" size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-24">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                onSave();
              }}
            >
              Save
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onSave(true);
              }}
            >
              Save as
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onExport();
              }}
            >
              Export
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
}
