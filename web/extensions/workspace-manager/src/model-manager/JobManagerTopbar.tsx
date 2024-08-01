import { useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import Flex from "@/components/ui/Flex";
import {
  IconPlayerPlayFilled,
  IconTriangleInvertedFilled,
} from "@tabler/icons-react";

export default function JobManagerTopbar() {
  const [queuingPrompt, setQueuingPrompt] = useState(false);
  const [jobs, setJobs] = useState<
    { id: string; finished_at: string; status: string }[]
  >([]);
  useEffect(() => {
    api.addEventListener("promptQueued", () => {
      setQueuingPrompt(false);
    });
    api.addEventListener("jobQueued", (e: CustomEvent<any>) => {
      console.log("Job queued", e.detail);
    });
  }, []);
  useEffect(() => {}, [jobs]);
  return (
    <Flex>
      <Button className="ml-2 gap-1" size={"sm"}>
        <span>Jobs</span>
        <IconTriangleInvertedFilled size={10} />
      </Button>
      <Button
        className="ml-2 gap-1"
        size={"sm"}
        isLoading={queuingPrompt}
        onClick={async () => {
          setQueuingPrompt(true);
          app.queuePrompt(1);
        }}
      >
        <IconPlayerPlayFilled size={14} />
        <span>Queue</span>
      </Button>
    </Flex>
  );
}
