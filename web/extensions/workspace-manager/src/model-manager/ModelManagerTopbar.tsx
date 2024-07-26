import { useEffect, useState } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import CustomDrawer from "@/components/ui/CustomDrawer";
import Flex from "@/components/ui/Flex";
import { IconRefresh } from "@tabler/icons-react";

export default function ModelManagerTopbar() {
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  return (
    <div>
      {showModelDrawer && (
        <CustomDrawer
          onClose={() => setShowModelDrawer(false)}
          className="w-full sm:w-full md:w-1/3"
        >
          <div className="gap-5">
            <Flex className="gap-5">
              <h2>My Models</h2>
              <Button variant="outline" size="icon">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </Flex>
          </div>
        </CustomDrawer>
      )}

      <Button className="ml-2" onClick={() => setShowModelDrawer(true)}>
        Models
      </Button>
    </div>
  );
}
