import Image from "next/image";
import Link from "next/link";
import Input from "../Input";
import { User } from "@/schema/user";

export function UsersList({
  search,
  setSearch,
  users,
  session,
  currentUser,
  setCurrentUser,
  typingUsers,
  onlineUsers,
  userMessageCount,
}: {
  search: string;
  setSearch: (input: string) => void;
  users: any[];
  session: User | null;
  currentUser: { id: string };
  setCurrentUser: (user: any) => void;
  typingUsers: any[];
  onlineUsers: any[];
  userMessageCount: any[];
}) {
  return (
    <div className="flex h-screen flex-col gap-4 overflow-auto bg-[#0f172a] p-4">
      <h4 className="text-center font-bold text-white">
        {session?.workSpace?.name}
      </h4>
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search"
        className="rounded border border-gray-700 p-2 text-gray-400"
      />
      <ul className="flex flex-col">
        {users &&
          users
            .filter((u: any) =>
              (u.name || "").toLowerCase().includes(search.toLowerCase()),
            )
            .map((user: any) => (
              <li
                key={user.id}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 ${currentUser?.id == user.id ? "bg-gray-700 text-white" : "text-gray-400"}`}
                onClick={() => setCurrentUser(user)}
              >
                <div className="flex items-center gap-2">
                  <Image
                    alt={user.name as string}
                    src={
                      user.image ||
                      "https://databyte.btpr.online/ProfilePictures/defaultnew.png"
                    }
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span>{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {userMessageCount[user.id] && Number(userMessageCount[user.id]) > 0 ? (<div className="bg-white px-2 flex items-center justify-center rounded-full text-gray-800">{userMessageCount[user.id]}</div>) : null}
                  {Object.keys(typingUsers).length > 0 &&
                    typingUsers[user.id] ? (
                    <span className="typing">typing…</span>
                  ) : (
                    <div
                      className={`h-2 w-2 rounded-full ${onlineUsers[user.id] ? "bg-green-500" : "bg-gray-500"}`}
                    ></div>
                  )}
                </div>
              </li>
            ))}
      </ul>
    </div>
  );
}
