"use client";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import Input from "../../../_components/Input";
import Button from "../../../_components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/images/logo.png";
import Image from "next/image";
import { useState } from "react";
import {toast} from "react-hot-toast";
import axiosInstance from "@/utils/axios";
import { setToken } from "@/utils/auth";

const signupSchema = z.object({
  code: z
    .string({ message: "Authentication code required" })
    .min(6, { message: "Authentication code invalid" }),
  user_email: z
    .string({ message: "Email required" })
    .email({ message: "Invalid email" }),
  user_id: z.string(),
  user_name: z.string(),
  company_name: z.string(),
  workspace: z.string(),
  license: z.string(),
  auth_code: z.string(),
  apiurl: z.string(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Authenticate() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const onSubmit = async (data: SignupFormData) => {
    if (data.code != atob(searchParams.get("auth_code") || "")) {
      return toast.error("Authentication code did not matched");
    }
    setIsLoading(true);
    const verify = await axiosInstance.post('/api/auth/verifyAuthCode', data);
    if (verify.data && verify.data.user.id) {
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
            {...register("code")}
            error={errors?.code?.message}
            autoComplete="off"
          />
          <input
            type="hidden"
            {...register("user_email")}
            defaultValue={atob(searchParams.get("user_email") || "")}
          />
          <input
            type="hidden"
            {...register("auth_code")}
            defaultValue={atob(searchParams.get("auth_code") || "")}
          />
          <input
            type="hidden"
            {...register("user_name")}
            defaultValue={atob(searchParams.get("user_name") || "")}
          />
          <input
            type="hidden"
            {...register("user_id")}
            defaultValue={atob(searchParams.get("user_id") || "")}
          />
          <input
            type="hidden"
            {...register("company_name")}
            defaultValue={atob(searchParams.get("company_name") || "")}
          />
          <input
            type="hidden"
            {...register("workspace")}
            defaultValue={atob(searchParams.get("workspace") || "")}
          />
          <input
            type="hidden"
            {...register("license")}
            defaultValue={atob(searchParams.get("license") || "")}
          />
          <input
            type="hidden"
            {...register("apiurl")}
            defaultValue={atob(searchParams.get("apiep") || "")}
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
