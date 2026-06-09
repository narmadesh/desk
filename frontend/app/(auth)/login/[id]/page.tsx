"use client";
import { useRouter, useParams, redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import Input from "../../../_components/Input";
import Button from "../../../_components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/images/logo.png";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { setToken } from "@/utils/auth";
import axiosInstance from "@/utils/axios";

const loginSchema = z.object({
  auth_code: z
    .string({ message: "Authentication code required" })
    .min(6, { message: "Authentication code invalid" }),
  id: z.string()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Authenticate() {
  const params = useParams();
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
    const verify = await axiosInstance.post('/api/auth/verifyLoginCode', data);
    if (verify.data && verify.data.user && verify.data.user.id) {
      const response = await axiosInstance.post('/api/auth/login', {
        email: verify.data.user.email,
        password: verify.data.user.password,
      });
      setIsLoading(false);
      if (response.data.success) {
        toast.success(response.data.message);
        setToken(response.data.access_token);
        router.push('/');
      }
      else {
        toast.error(response.data.message);
      }
    }
    else {
      toast.error("Authentication code did not matched");
    }
    setIsLoading(false);
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
            label="Authentication Code"
            type="text"
            placeholder="Enter authentication code"
            {...register("auth_code")}
            error={errors?.auth_code?.message}
            autoComplete="off"
          />
          <input
            type="hidden"
            {...register("id")}
            defaultValue={atob(params.id as string)}
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
