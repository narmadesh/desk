"use client";

import Link from "next/link";
import Button from "../_components/Button";
import { useSearchParams } from "next/navigation";

export default function Error() {
    const searchParams = useSearchParams();
  return (
    <div className="bg-gray-800 flex justify-center items-center flex-col h-screen gap-4">
      <h1 className="text-3xl text-white">Something went wrong!</h1>
      <p className="text-lg text-white">{searchParams.get('message')}</p>
      <Link href="/login"><Button>Go to Login</Button></Link>
    </div>
  );
}
