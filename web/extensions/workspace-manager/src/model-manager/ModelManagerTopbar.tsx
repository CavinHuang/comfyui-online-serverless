import { useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import CustomDrawer from "@/components/ui/CustomDrawer";
import Flex from "@/components/ui/Flex";
import { IconRefresh, IconX } from "@tabler/icons-react";
import { fetchListModels } from "./ModelManagerApi";
import { InstallModelDialog } from "./InstallModelDialog";
import ModelsListFileTree, { FileNode } from "./ModelsListFileTree";
import { convertToTree } from "./fileTreeUtils";

export default function ModelManagerTopbar({
  className,
}: {
  className?: string;
}) {
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [openInstallModel, setOpenInstallModel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getTreeFromSnapshot = () => {
    const snapshot = JSON.parse(api.machine?.snapshot ?? "{}");
    const converted = convertToTree(snapshot.models ?? {});
    console.log("converted", converted);
    return converted;
  };

  const [models, setModels] = useState<FileNode[]>(() => getTreeFromSnapshot());
  useEffect(() => {
    window.addEventListener("get_machine_workflow", (e: any) => {
      setModels(getTreeFromSnapshot());
    });
  }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    console.log(api.machine);
    const res = await fetchListModels(api.machine?.id);
    console.log("res", res);
    if (!res) {
      setRefreshing(false);
      return;
    }

    const tree = convertToTree(res);
    console.log("tree", tree);
    setModels(tree);
    setRefreshing(false);
  };
  return (
    <Flex className={className + " items-center"}>
      {showModelDrawer && (
        <CustomDrawer
          onClose={() => setShowModelDrawer(false)}
          className="w-full md:!w-[500px]"
        >
          <div className="gap-5 p-5">
            <Flex className="justify-between mb-5">
              <Flex className="gap-5 items-center">
                <h2 className="font-medium text-lg">My Models</h2>
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
            <ModelsListFileTree tree={models} />
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
      <Button
        className="ml-2"
        size={"sm"}
        onClick={() => setShowModelDrawer(true)}
      >
        <IconRefresh size={18} />
      </Button>
      {openInstallModel && (
        <InstallModelDialog onClose={() => setOpenInstallModel(false)} />
      )}
    </Flex>
  );
}
