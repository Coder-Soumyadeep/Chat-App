"use client";
import { useAppData, user_service } from "@/context/AppContext";
import { useCall } from "@/context/CallContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import {
  ArrowLeft,
  Music4,
  Pause,
  Play,
  Save,
  Trash2,
  Upload,
  User,
  UserCircle,
} from "lucide-react";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();
  const {
    ringtonePresets,
    selectedRingtone,
    customRingtone,
    setRingtonePreset,
    useCustomRingtone,
    setCustomRingtone,
    clearCustomRingtone,
    previewRingtone,
    stopRingtonePreview,
  } = useCall();

  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState<string | undefined>("");
  const [previewingRingtone, setPreviewingRingtone] = useState<string | null>(null);

  const router = useRouter();

  const editHandler = () => {
    setIsEdit(!isEdit);
    setName(user?.name);
  };

  const submitHandler = async (e: any) => {
    e.preventDefault();
    const token = Cookies.get("token");
    try {
      const { data } = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });

      toast.success(data.message);
      setUser(data.user);
      setIsEdit(false);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleCustomRingtone = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await setCustomRingtone(file);
      toast.success("Custom ringtone updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update ringtone");
    } finally {
      e.target.value = "";
    }
  };

  const handlePreview = async (ringtoneId?: string) => {
    try {
      setPreviewingRingtone(ringtoneId || selectedRingtone);
      await previewRingtone(ringtoneId);
    } catch {
      setPreviewingRingtone(null);
    }
  };

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  useEffect(() => {
    return () => {
      stopRingtonePreview();
    };
  }, [stopRingtonePreview]);

  if (loading) return <Loading />;
  return (
    <div className="app-shell min-h-screen p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push("/chat")}
            className="theme-card rounded-2xl p-3 transition hover:scale-[1.03]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold">Profile Settings</h1>
            <p className="mt-1 theme-soft">
              Manage your account information
            </p>
          </div>
        </div>

        <div className="theme-panel-strong overflow-hidden rounded-[2rem]">
          <div className="theme-panel-muted border-b p-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="theme-card flex h-20 w-20 items-center justify-center rounded-full">
                  <UserCircle className="h-12 w-12 theme-soft" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-[var(--surface-strong)] bg-[var(--success)]"></div>
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-2xl font-semibold">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm theme-soft">Active now</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-semibold theme-soft">
                  Display Name
                </label>

                {isEdit ? (
                  <form onSubmit={submitHandler} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="theme-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                      />
                      <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform theme-muted" />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="theme-brand flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={editHandler}
                        className="theme-card flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="theme-panel-muted flex items-center justify-between rounded-2xl p-4">
                    <span className="text-lg font-medium">
                      {user?.name || "Not set"}
                    </span>
                    <button
                      onClick={editHandler}
                      className="theme-card flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold theme-soft">
                  Calling Ringtone
                </label>
                <div className="space-y-3">
                  {ringtonePresets.map((preset) => {
                    const isActive = selectedRingtone === preset.id;
                    const isPreviewing = previewingRingtone === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="theme-panel-muted flex items-center gap-3 rounded-2xl p-4"
                      >
                        <div className="theme-card rounded-2xl p-3">
                          <Music4 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{preset.name}</div>
                          <div className="mt-1 text-sm theme-muted">
                            {preset.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            isPreviewing
                              ? (stopRingtonePreview(), setPreviewingRingtone(null))
                              : handlePreview(preset.id)
                          }
                          className="theme-card rounded-full p-3"
                        >
                          {isPreviewing ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRingtonePreset(preset.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            isActive ? "theme-brand text-white" : "theme-card"
                          }`}
                        >
                          {isActive ? "Selected" : "Use"}
                        </button>
                      </div>
                    );
                  })}

                  <div className="theme-panel-muted rounded-2xl p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="theme-card rounded-2xl p-3">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">Custom ringtone</div>
                        <div className="mt-1 text-sm theme-muted">
                          Upload your own audio file up to 2MB.
                        </div>
                      </div>
                    </div>

                    {customRingtone && (
                      <div
                        className="mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{customRingtone.name}</div>
                          <div className="text-sm theme-muted">
                            {selectedRingtone === "custom"
                              ? "Currently selected"
                              : "Uploaded and ready"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            previewingRingtone === "custom"
                              ? (stopRingtonePreview(), setPreviewingRingtone(null))
                              : handlePreview("custom")
                          }
                          className="theme-card rounded-full p-3"
                        >
                          {previewingRingtone === "custom" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={useCustomRingtone}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            selectedRingtone === "custom" ? "theme-brand text-white" : "theme-card"
                          }`}
                        >
                          {selectedRingtone === "custom" ? "Selected" : "Use"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopRingtonePreview();
                            setPreviewingRingtone(null);
                            clearCustomRingtone();
                          }}
                          className="rounded-full bg-red-600 px-3 py-2 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="theme-card inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 font-semibold">
                        <Upload className="h-4 w-4" />
                        Upload Sound
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleCustomRingtone}
                        />
                      </label>
                      {customRingtone && (
                        <button
                          type="button"
                          onClick={() => setRingtonePreset("classic-bell")}
                          className="theme-card rounded-2xl px-4 py-3 font-semibold"
                        >
                          Use default preset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
