"use client";
import { useRouter, useSearchParams,useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Input from "../_components/Input";
import Button from "../_components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/images/logo.png";
import Image from "next/image";

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Workspace() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    console.log(data)
    // router.push(`/signup/${data.workspace}${window.location.search}`);
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <Image src={logo} alt="logo" width={128} height={128} />
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[3rem]">{searchParams.get('workspace')}</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-md max-w-md space-y-6"
        >
          <Input
            label="Email"
            type="text"
            placeholder="Enter email"
            {...register("email")}
            error={errors?.email?.message}
            defaultValue={atob(searchParams.get("user_email") || "")}
          />
          <input
            type="hidden"
            name="user_name"
            defaultValue={atob(searchParams.get("user_name") || "")}
          />
          <input
            type="hidden"
            name="user_id"
            defaultValue={atob(searchParams.get("user_id") || "")}
          />
          <input
            type="hidden"
            name="company_name"
            defaultValue={searchParams.get('workspace') as string}
          />
          <Button type="submit" fullWidth={true} loading={isLoading}>
            Continue
          </Button>
        </form>
      </div>
    </main>
  );
}
