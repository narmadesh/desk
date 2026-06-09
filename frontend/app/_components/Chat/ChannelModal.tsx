import { X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import axiosInstance from "@/utils/axios";
import toast from "react-hot-toast";
import Input from "../Input";
import Button from "../Button";

const signupSchema = z.object({
    name: z.string().min(1, 'Channel name required'),
});

type SignupFormData = z.infer<typeof signupSchema>;
export default function ChannelModal({
    setAddChannel,
    getUsers,
    setCurrentUser
}: {
    setAddChannel: (channel: boolean) => void
    getUsers: () => void,
    setCurrentUser: (user: any) => void;
}) {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        const response = await axiosInstance.post('/api/group', data);
        setIsLoading(false);
        if (response.data.success) {
            toast.success(response.data.message);
            setAddChannel(false);
            setCurrentUser(response.data.group);
        }
        else {
            toast.error(response.data.message);
        }
    };
    return (
        <div className="fixed inset-0 z-99 bg-black/50 bg-opacity-60 flex items-start justify-center px-4">
            <div className="relative top-10 mx-auto shadow-xl rounded-md bg-white max-w-xl w-full flex flex-col max-h-[90vh]">
                <div className="flex justify-between p-2">
                    <h5 className="font-bold text-gray-800 text-xl p-1.5 modal-title">Add new channel</h5>
                    <button onClick={() => setAddChannel(false)} type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <X size={18} />
                    </button>
                </div>
                <hr />
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="channel-form" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="Channel Name"
                            type="text"
                            placeholder="Enter channel name"
                            {...register("name")}
                            error={errors?.name?.message}
                        />
                    </form>
                </div>
                <hr />
                <div className="flex justify-end gap-2 p-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setAddChannel(false)}
                    >
                        Close
                    </Button>
                    <Button
                        type="submit"
                        loading={isLoading}
                        disabled={isLoading}
                        form="channel-form"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    )
}