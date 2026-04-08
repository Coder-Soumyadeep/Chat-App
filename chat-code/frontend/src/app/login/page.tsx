"use client";
import Loading from "@/components/Loading";
import { useAppData, user_service } from "@/context/AppContext";
import axios from "axios";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const { isAuth, loading: userLoading } = useAppData();

  const handleSubmit = async (
    e: React.FormEvent<HTMLElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${user_service}/api/v1/login`, {
        email,
      });

      toast.success(data.message);
      router.push(`/verify?email=${email}`);
    } catch (error: any) {
  toast.error(
    error?.response?.data?.message || "Something went wrong"
  );
} finally {
      setLoading(false);
    }
  };

  if (userLoading) return <Loading />;
  if (isAuth) return redirect("/chat");
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:flex flex-col justify-between rounded-[2rem] p-10 theme-panel-strong">
          <div>
            <div className="mb-6 inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] theme-card">
              Chat Atlas
            </div>
            <h1 className="max-w-md text-5xl font-semibold leading-tight">
              Conversations that feel fast, focused, and human.
            </h1>
            <p className="mt-6 max-w-lg text-lg theme-soft">
              Sign in with your email, jump into real-time chat, share media, and launch calls
              from one calm workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Realtime messaging", "Voice and video calls", "Clean profile flow"].map(
              (item) => (
                <div key={item} className="theme-card rounded-2xl px-4 py-4 text-sm font-medium">
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="theme-panel-strong rounded-[2rem] p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="theme-brand mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg">
              <Mail size={40} className="text-white" />
            </div>
              <h1 className="mb-3 text-4xl font-semibold">Welcome to ChatApp</h1>
              <p className="text-lg theme-soft">Enter your email to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium theme-soft">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="theme-input w-full rounded-2xl px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="theme-brand w-full rounded-2xl px-6 py-4 font-semibold shadow-lg transition hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP to your mail...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
