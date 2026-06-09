import { EllipsisVertical, Search } from "lucide-react";
import Image from "next/image";
import Button from "../Button";
import Dropdown from "../Dropdown";
import { User } from "@/schema/user";
import { useState } from "react";
import ChannelInfoModal from "./ChannelInfoModal";

export function Header({
  currentUser,
  typingUsers,
  setShowSearch,
  showSearch,
  tab,
  profile,
  setShowInfoModal,
  setShowDeleteChannelModal
}: {
  currentUser: any;
  typingUsers: any[];
  setShowSearch: (show: boolean) => void;
  showSearch: boolean;
  tab: string;
  profile: User | null;
  setShowInfoModal: (show: boolean) => void;
  setShowDeleteChannelModal: (show: boolean) => void
}) {

  const options = [
    ...(profile?.id === currentUser?.userId
      ? [{ label: "View Members", onClick: () => setShowInfoModal(true) }, { label: "Delete", onClick: () => setShowDeleteChannelModal(true) }]
      : []),
  ];
  return (
    <div className="flex items-center justify-between border-b border-b-[#e5e7eb] bg-[linear-gradient(90deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)] px-5 py-3">
      <div className="flex items-center gap-2">
        <Image
          alt={currentUser.name as string}
          src={
            currentUser.image ||
            "https://databyte.btpr.online/ProfilePictures/defaultnew.png"
          }
          width={20}
          height={20}
          className="h-5 w-5 rounded-full object-cover"
        />
        <span className="font-bold text-gray-900">{currentUser.name}</span>
        {Object.keys(typingUsers).length > 0 && (
          <span className="typing text-gray-500">typing…</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="tool" tooltip="Search Chats" onClick={() => setShowSearch(!showSearch)}><Search size={15} /></Button>

        {tab == 'channels' ? <Dropdown
          items={options}
          onSelect={(item) => console.log(item)}
        >
          <Button variant="tool" tooltip="More"><EllipsisVertical size={15} /></Button>
        </Dropdown> : null}
      </div>
    </div>
  );
}
