"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Square, Send, RotateCcw, X } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSend: (blob: Blob, duration: number) => void;
};

export default function VideoRecorderModal({
    open,
    onClose,
    onSend,
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);

    const [recording, setRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!open) return;

        const initCamera = async () => {
            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: "user",
                        },
                        audio: true,
                    });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error(err);
            }
        };

        initCamera();

        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [open]);

    const startRecording = () => {
        if (!streamRef.current) return;

        chunksRef.current = [];

        const recorder = new MediaRecorder(streamRef.current, {
            mimeType: "video/webm",
        });

        recorderRef.current = recorder;
        startTimeRef.current = Date.now();

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, {
                type: "video/webm",
            });

            const url = URL.createObjectURL(blob);

            setVideoBlob(blob);
            setPreviewUrl(url);

            setDuration(
                (Date.now() - startTimeRef.current) / 1000
            );
        };

        recorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        setRecording(false);
    };

    const retake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(null);
        setVideoBlob(null);
        setDuration(0);
    };

    const sendVideo = () => {
        if (!videoBlob) return;

        onSend(videoBlob, duration);

        handleClose();
    };

    const handleClose = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(null);
        setVideoBlob(null);
        setRecording(false);

        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-5xl rounded-2xl bg-white p-4">
                <div className="mb-4 flex justify-end">
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <X />
                    </button>
                </div>

                {!previewUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="aspect-video w-full rounded-xl bg-black"
                        />

                        <div className="mt-4 flex justify-center">
                            {!recording ? (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-white cursor-pointer"
                                >
                                    <Camera size={18} />
                                    Record
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 rounded-full bg-red-700 px-5 py-3 text-white cursor-pointer"
                                >
                                    <Square size={18} />
                                    Stop
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <video
                            controls
                            src={previewUrl}
                            className="aspect-video w-full rounded-xl"
                        />

                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={retake}
                                className="flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 cursor-pointer"
                            >
                                <RotateCcw size={16} />
                                Retake
                            </button>

                            <button
                                onClick={sendVideo}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white cursor-pointer"
                            >
                                <Send size={16} />
                                Send
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}