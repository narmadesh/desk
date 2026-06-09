"use client";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import Input from "../../_components/Input";
import Button from "../../_components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/images/logo.png";
import Image from "next/image";
import { useState } from "react";
import axiosInstance from "@/utils/axios";
import {toast} from "react-hot-toast";
import { setToken } from "@/utils/auth";

const loginSchema = z.object({
  workspace: z.string({ message: "Workspace required" }),
  email: z.string({ message: "Email required" }).email({ message: "Invalid email format" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const response = await axiosInstance.post('/api/auth/validateLogin', data);
    setIsLoading(false);
    if (response.data.success) {
      toast.success(response.data.message);
      router.push(
        `/login/${btoa(response.data.user.id)}`,
      );
    }
    else {
      toast.error(response.data.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <Image src={logo} alt="logo" width={128} height={128} />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-md max-w-md space-y-6"
        >
          <Input
            label="Workspace"
            type="text"
            placeholder="Enter workspace name"
            {...register("workspace")}
            error={errors?.workspace?.message}
            defaultValue={atob(searchParams.get("workspace") || "")}
          />
          <Input
            label="Email"
            type="text"
            placeholder="Enter email"
            {...register("email")}
            error={errors?.email?.message}
            defaultValue={atob(searchParams.get("user_email") || "")}
          />
          <Button
            type="submit"
            fullWidth={true}
            loading={isLoading}
            disabled={isLoading}
          >
            Continue
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </main>
  );
}
