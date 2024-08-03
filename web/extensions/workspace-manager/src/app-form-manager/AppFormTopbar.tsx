import { Button } from "@/components/ui/button";
import { IconRocket } from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";

export default function AppFormTopbar() {
  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <Button
        size={"sm"}
        className="bg-purple-500 text-white"
        onClick={() => {}}
      >
        <IconRocket size={18} /> App
      </Button>
    </Flex>
  );
}
