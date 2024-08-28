import Flex from "@/components/ui/Flex";
import { useContext } from "react";
import { WorkspaceContext } from "@/WorkspaceContext";

export default function ProfileTopbar() {
  const { user } = useContext(WorkspaceContext);

  if (!user) {
    return (
      <a
        style={{ cursor: "pointer" }}
        onClick={() => {
          window.parent.postMessage(
            {
              type: "change_url",
              url: "/auth/signin",
            },
            "*",
          );
        }}
      >
        Login
      </a>
    );
  }
  return (
    <Flex className="items-center gap-2">
      <a href={`/profile/${user.username}`} target="_blank">
        <img
          src={user.imageUrl ?? `/assets/user_placeholder.png`}
          alt="avatar"
          className="w-6 h-6 rounded-full"
        />
      </a>
    </Flex>
  );
}
