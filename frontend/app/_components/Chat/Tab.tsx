import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Hash, Link as LinkIcon } from "lucide-react";
import { User } from "@/schema/user";

export function Tab({
  tab,
  setTab,
  setCurrentUser,
  session,
}: {
  tab: string;
  setTab: (tab: string) => void;
  setCurrentUser: (user: any) => void;
  session: User | null;
}) {
  return (
    <div className="flex h-screen flex-col justify-between border-r border-r-gray-700 bg-[#0b1220] p-3 text-white">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 ${tab == "chat" ? "bg-gray-800" : ""}`}
          title="Team Inbox"
          aria-label="Team Inbox"
          onClick={() => { setTab("chat"); setCurrentUser(null) }}
        >
          <MessageCircle size={15} fill="white" />
        </button>
        <button
          type="button"
          className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 ${tab == "channels" ? "bg-gray-800" : ""}`}
          title="Channels"
          aria-label="Channels"
          onClick={() => { setTab("channels"); setCurrentUser(null) }}
        >
          <Hash size={15} />
        </button>
        <button
          type="button"
          className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 ${tab == "connections" ? "bg-gray-800" : ""}`}
          title="Connections"
          aria-label="Connections"
          onClick={() => { setTab("connections"); setCurrentUser(null) }}
        >
          <LinkIcon size={15} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link
          href={"/profile"}
          className="h-8 w-8 rounded-lg border border-gray-700"
          title={session?.name as string}
        >
          <Image
            alt={(session?.name ?? 'User') as string}
            src={
              session?.image ||
              "https://databyte.btpr.online/ProfilePictures/defaultnew.png"
            }
            width={40}
            height={40}
            className="rounded-lg"
          />
        </Link>
      </div>
    </div>
  );
}
