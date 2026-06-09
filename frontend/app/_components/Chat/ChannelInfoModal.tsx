import { X } from "lucide-react"
import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axios";
import toast from "react-hot-toast";
import Button from "../Button";
import { User } from "@/schema/user";
import { useSession } from "@/context/SessionContext";
import Image from "next/image";

export default function ChannelInfoModal({
    setShowInfoModal,
    setCurrentUser,
    currentUser,
    setMemberId,
    setShowDeleteMemberModal
}: {
    setShowInfoModal: (channel: boolean) => void;
    setCurrentUser: (user: any) => void;
    currentUser: any;
    setMemberId: (id: string) => void;
    setShowDeleteMemberModal:(show:boolean) => void
}) {

    const [users, setUsers] = useState<User[]>([]);
    const { profile } = useSession();

    useEffect(() => {
        axiosInstance.get('/api/users').then(function (resp) {
            if (resp.data.users && resp.data.users.length > 0) {
                setUsers(resp.data.users);
            }
        })
    }, []);

    const addMember = async (id: string) => {
        const response = await axiosInstance.post('/api/group/member', { userId: id, groupId: currentUser.id });
        if (response.data.success) {
            toast.success(response.data.message);
            setShowInfoModal(false);
        }
        else {
            toast.error(response.data.message);
        }
    };
    return (
        <div className="fixed inset-0 z-99 bg-black/50 bg-opacity-60 flex items-start justify-center px-4">
            <div className="relative top-10 mx-auto shadow-xl rounded-md bg-white max-w-xl w-full flex flex-col max-h-[90vh]">
                <div className="flex justify-between p-2">
                    <h5 className="font-bold text-gray-800 text-xl p-1.5 modal-title">{currentUser.name} Members</h5>
                    <button onClick={() => setShowInfoModal(false)} type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <X size={18} />
                    </button>
                </div>
                <hr />
                <div className="p-2 overflow-y-auto flex-1">
                    <ul className="divide-y divide-gray-200 text-slate-500">
                        {users.map((user) => {
                            if (currentUser.members.filter((e: any) => e.userId == user.id).length > 0) {
                                return <li className="flex justify-between items-center p-2" key={user.id}>
                                    <div className="flex items-center gap-2"><Image
                                        alt={user.name as string}
                                        src={
                                            user.image ||
                                            "https://databyte.btpr.online/ProfilePictures/defaultnew.png"
                                        }
                                        width={20}
                                        height={20}
                                        className="h-5 w-5 rounded-full object-cover"
                                    />
                                        {user.name}</div>
                                    <button className="text-blue-500 cursor-pointer" onClick={() => {
                                        if (user.id != profile?.id) {
                                            setMemberId(user.id);
                                            setShowInfoModal(false);
                                            setShowDeleteMemberModal(true);
                                        }
                                    }}>{user.id == profile?.id ? 'You' : 'Remove from channel'}</button>
                                </li>
                            }
                        })}
                        {users.map((user) => {
                            if (currentUser.members.filter((e: any) => e.userId == user.id).length <= 0) {
                                return <li className="flex justify-between items-center p-2" key={user.id}>
                                    <div className="flex items-center gap-2"><Image
                                        alt={user.name as string}
                                        src={
                                            user.image ||
                                            "https://databyte.btpr.online/ProfilePictures/defaultnew.png"
                                        }
                                        width={20}
                                        height={20}
                                        className="h-5 w-5 rounded-full object-cover"
                                    />
                                        {user.name}</div>
                                    <button className="text-blue-500 cursor-pointer" onClick={() => {
                                        addMember(user.id);
                                    }}>Add to channel</button>
                                </li>
                            }
                        })}
                    </ul>
                </div>
                <hr />
                <div className="flex justify-end gap-2 p-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowInfoModal(false)}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}