"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Square, Send, RotateCcw, X } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSend: (blob: Blob, duration: number) => void;
};

export default function ScreenRecorderModal({
    open,
    onClose,
    onSend,
}: Props) {
    const previewRef = useRef<HTMLVideoElement>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);

    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);

    const [recording, setRecording] = useState(false);

    const [recordedBlob, setRecordedBlob] =
        useState<Blob | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    const [duration, setDuration] = useState(0);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const startRecording = async () => {
        try {
            const displayStream =
                await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });

            streamRef.current = displayStream;

            if (previewRef.current) {
                previewRef.current.srcObject = displayStream;
            }

            chunksRef.current = [];

            const recorder = new MediaRecorder(
                displayStream,
                {
                    mimeType: "video/webm",
                }
            );

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

                streamRef.current
                    ?.getTracks()
                    .forEach(track => track.stop());

                if (previewRef.current) {
                    previewRef.current.srcObject = null;
                }

                setRecordedBlob(blob);
                setPreviewUrl(url);
            };

            displayStream
                .getVideoTracks()[0]
                .addEventListener("ended", () => {
                    if (recording) {
                        stopRecording();
                    }
                });

            recorder.start();

            setRecording(true);
        } catch (err) {
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (!recorderRef.current) return;

        recorderRef.current.stop();

        setRecording(false);
    };

    const retake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setRecordedBlob(null);
        setPreviewUrl(null);
        setDuration(0);
    };

    const sendRecording = () => {
        if (!recordedBlob) return;

        onSend(recordedBlob, duration);

        handleClose();
    };

    const cleanup = () => {
        streamRef.current
            ?.getTracks()
            .forEach((track) => track.stop());

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };

    const handleClose = () => {
        cleanup();

        setRecording(false);
        setRecordedBlob(null);
        setPreviewUrl(null);

        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-5xl rounded-xl bg-white p-4">

                <div className="mb-4 flex justify-end">
                    <button onClick={handleClose}>
                        <X />
                    </button>
                </div>

                {!previewUrl ? (
                    <>
                        <video
                            ref={previewRef}
                            autoPlay
                            muted
                            playsInline
                            onLoadedMetadata={(e) => {
                                setDuration(
                                    e.currentTarget.duration
                                );
                            }}
                            className="aspect-video w-full rounded-xl bg-black"
                        />

                        <div className="mt-4 flex justify-center">

                            {!recording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white cursor-pointer"
                                >
                                    <Monitor size={18} />
                                    Share Screen
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-white cursor-pointer"
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
                            onLoadedMetadata={(e) => {
                                setDuration(
                                    e.currentTarget.duration
                                );
                            }}
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
                                onClick={sendRecording}
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