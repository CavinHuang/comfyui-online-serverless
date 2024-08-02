import { useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import Flex from "@/components/ui/Flex";
import { IconRefresh } from "@tabler/icons-react";
import ModelManagerDrawer from "./ModelManagerDrawer";

export default function ModelManagerTopbar({
  className,
}: {
  className?: string;
}) {
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [refreshingNodes, setRefreshingNodes] = useState(false);
  return (
    <Flex className={className + " items-center"}>
      {showModelDrawer && (
        <ModelManagerDrawer onClose={() => setShowModelDrawer(false)} />
      )}
      <Button
        variant={"secondary"}
        className="ml-2"
        size={"sm"}
        isLoading={refreshingNodes}
        title="Refresh widgets in nodes to find new models or files"
        onClick={async () => {
          setRefreshingNodes(true);
          try {
            await app.refreshComboInNodes();
          } catch (err) {
            alert("Failed to refresh nodes. Please try again.");
            console.error(err);
          }
          setRefreshingNodes(false);
        }}
      >
        <IconRefresh size={18} />
      </Button>
      {api.machine?.id ? (
        <Button
          className="ml-2"
          size={"sm"}
          onClick={() => setShowModelDrawer(true)}
        >
          Models
        </Button>
      ) : (
        <p>❓Select Machine</p>
      )}
    </Flex>
  );
}
