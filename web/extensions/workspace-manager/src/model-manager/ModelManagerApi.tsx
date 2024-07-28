export async function fetchListModels(
  machineID: string,
  rpEndpointID?: string,
): Promise<Record<
  string,
  {
    path: string;
    size: string;
  }
> | null> {
  console.log(machineID);
  if (!machineID) {
    console.error("Machine ID is missing");
    return null;
  }
  return await fetch("/api/machine/listMachineModels?machineID=" + machineID)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return {
        model1: {
          size: "0gb",
        },
      };
    });
}
