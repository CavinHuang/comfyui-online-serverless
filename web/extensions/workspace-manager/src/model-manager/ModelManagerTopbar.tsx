import { useEffect, useState } from "react";
import { app } from "../comfyapp";
import { Button } from "@/components/ui/button";

export default function ModelManagerTopbar() {
  return (
    <div>
      <Button onClick={() => app.modelManager.createModel()}>Models</Button>
    </div>
  );
}
