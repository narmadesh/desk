import { X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import axiosInstance from "@/utils/axios";
import toast from "react-hot-toast";
import Input from "../Input";
import Button from "../Button";

export default function DeleteModal({
    title,
    text,
    setShowDeleteModal,
    currentUser,
    setCurrentUser,
    onClick
}: {
    title: string;
    text: string;
    setShowDeleteModal: (channel: boolean) => void
    currentUser: any;
    setCurrentUser: (user: any) => void;
    onClick: () => void
}) {

    const [isLoading, setIsLoading] = useState(false);
    const deleteModal = () => {
        setIsLoading(true);
        onClick();
        setTimeout(function(){
            setIsLoading(false);
        },2000);
    }
    return (
        <div className="fixed inset-0 z-99 bg-black/50 bg-opacity-60 flex items-start justify-center px-4">
            <div className="relative top-10 mx-auto shadow-xl rounded-md bg-white max-w-xl w-full flex flex-col max-h-[90vh]">
                <div className="flex justify-between p-2">
                    <h5 className="font-bold text-gray-800 text-xl p-1.5 modal-title">{title}</h5>
                    <button onClick={() => setShowDeleteModal(false)} type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <X size={18} />
                    </button>
                </div>
                <hr />
                <div className="p-6 overflow-y-auto flex-1 text-slate-500">
                    {text}
                </div>
                <hr />
                <div className="flex justify-end gap-2 p-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="danger"
                        type="button"
                        onClick={deleteModal}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>
        </div>
    )
}