import { useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import CustomDrawer from "@/components/ui/CustomDrawer";
import Flex from "@/components/ui/Flex";
import { IconRefresh, IconX } from "@tabler/icons-react";
import { fetchListModels } from "./ModelManagerApi";
import { InstallModelDialog } from "./InstallModelDialog";

export default function ModelManagerTopbar({
  className,
}: {
  className?: string;
}) {
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [openInstallModel, setOpenInstallModel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    console.log(api.machine);
    const models = await fetchListModels(api.machine?.id);
    setRefreshing(false);
  };
  return (
    <div className={className}>
      {showModelDrawer && (
        <CustomDrawer
          onClose={() => setShowModelDrawer(false)}
          className="w-full md:!w-1/3"
        >
          <div className="gap-5 p-2">
            <Flex className="justify-between">
              <Flex className="gap-5 items-center">
                <h2 className="font-medium">My Models</h2>
                <Button size="sm" onClick={onRefresh} isLoading={refreshing}>
                  <IconRefresh className="h-4 w-4" />
                </Button>
                <Button onClick={() => setOpenInstallModel(true)}>
                  Install Model
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
      {openInstallModel && (
        <InstallModelDialog onClose={() => setOpenInstallModel(false)} />
      )}
    </div>
  );
}
