import { Button } from "@/components/ui/button";
import {
  IconChevronLeft,
  IconChevronRight,
  IconRocket,
} from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import { api, app } from "@/comfyapp";
import { useState } from "react";

export default function AppFormTopbar() {
  const [showApp, setShowApp] = useState(false);
  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <Button
        size={"sm"}
        className="bg-purple-500 hover:bg-purple-300 text-white"
        onClick={async () => {
          if (showApp) {
            window.parent.postMessage(
              {
                type: "hide_app_maker",
              },
              "*",
            );
            setShowApp(false);
            return;
          }
          const p = await app.graphToPrompt();
          window.parent.postMessage(
            {
              type: "show_app_maker",
              nodeDefObj: JSON.parse(api.machine?.object_info ?? "{}"),
              apiPrompt: p.output,
              deps: app.graph.extra?.deps ?? null,
              machine: api.machine,
            },
            "*",
          );
          setShowApp(true);
        }}
      >
        {showApp ? (
          <IconChevronLeft size={18} />
        ) : (
          <IconChevronRight size={18} />
        )}
        <IconRocket size={18} /> App
      </Button>
    </Flex>
  );
}
