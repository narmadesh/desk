"use client";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import Input from "../../_components/Input";
import Button from "../../_components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/images/logo.png";
import Image from "next/image";
import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axios";
import {toast} from "react-hot-toast";

const signupSchema = z.object({
  workspace: z.string({ message: "Workspace required" }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("workspace_id")) {
      redirect(`/login/${window.location.search}`);
    }
    if (
      (!searchParams.get("user_type") ||
        atob(searchParams.get("user_type") as string) !== "Admin") &&
      !searchParams.get("workspace_id")
    ) {
      redirect("/error?message=Only admin can signup");
    }
    axiosInstance.post('/api/auth/checkLicense', {
      license: atob(searchParams.get("license") || "")
    }).then(function (resp) {
      if (resp.data && resp.data.workspace && resp.data.workspace.id) {
        redirect(`/login/${window.location.search}`);
      }
    });
  }, [searchParams]);

  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const sendAuthCode = async (workspace:string) => {
    const code = await axiosInstance.post('/api/auth/sendAuthCode', {
      user_id: atob(searchParams.get("user_id") || ""),
      license: atob(searchParams.get("license") || ""),
      apiurl: atob(searchParams.get("apiep") || ""),
    });
    if (code.data && code.data.message != "Error") {
      router.push(
        `/signup/authenticate${window.location.search}&workspace=${btoa(workspace)}&auth_code=${btoa(code.data.message)}`,
      );
    }
  }
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    const response = await axiosInstance.post('/api/auth/checkWorkspace', { name: data.workspace });
    setIsLoading(false);
    if (response.data.id) {
      toast.error('This workspace name is already in use');
    }
    else {
      sendAuthCode(data.workspace);
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
            defaultValue={atob(searchParams.get("company_name") || "")}
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
