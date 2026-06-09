"use client";
import { removeToken } from "@/utils/auth";
import Button from "../../_components/Button";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function Profile() {
  const router = useRouter();
  const socket = useSocket();
  function logout() {
    socket.disconnect();
    removeToken();
    router.push('/login');
  }
  return (
    <main className="flex h-screen items-center justify-center gap-2">
      <Button
        variant="primary"
        onClick={() => { logout() }}
      >
        Signout
      </Button>
      <Button variant="secondary" onClick={() => router.push("/")}>
        Back
      </Button>
    </main>
  );
}
