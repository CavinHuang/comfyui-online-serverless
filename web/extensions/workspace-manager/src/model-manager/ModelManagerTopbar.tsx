import { useEffect, useState } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import CustomDrawer from "@/components/ui/CustomDrawer";
import Flex from "@/components/ui/Flex";
import { IconRefresh, IconX } from "@tabler/icons-react";

export default function ModelManagerTopbar({
  className,
}: {
  className?: string;
}) {
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  return (
    <div className={className}>
      {showModelDrawer && (
        <CustomDrawer
          onClose={() => setShowModelDrawer(false)}
          className="w-full md:!w-1/3"
        >
          <div className="gap-5 p-8">
            <Flex className="justify-between">
              <Flex className="gap-5">
                <h2 className="font-medium">My Models</h2>
                <Button size="sm">
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </Flex>
              <Button
                variant={"ghost"}
                onClick={() => setShowModelDrawer(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </Flex>
          </div>
        </CustomDrawer>
      )}

      <Button
        className="ml-2"
        size={"sm"}
        onClick={() => setShowModelDrawer(true)}
      >
        Models
      </Button>
    </div>
  );
}
