"use client";

import { File, Play } from "lucide-react";
import { useState } from "react";

type Attachment = {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
};

export default function AttachmentRenderer({
    attachments,
    setSelectedFile
}: {
    attachments: Attachment[];
    setSelectedFile: (fileUrl: string) => void;
}) {

    return (
        <>
            <div className={`grid gap-2 ${attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {attachments.map((file, index) => {
                    if (index < 3) {
                        const fullUrl =
                            process.env
                                .NEXT_PUBLIC_API_BASE_URL +
                            file.url;

                        if (
                            file.mimeType.startsWith(
                                "image/"
                            )
                        ) {
                            return (
                                <div className="w-full h-40 cursor-pointer" onClick={() => setSelectedFile(fullUrl)} key={file.id}>
                                    <img
                                        src={fullUrl}
                                        alt={file.name}
                                        className="rounded-xl h-full w-full object-cover"
                                    />
                                </div>
                            );
                        }

                        if (
                            file.mimeType.startsWith(
                                "video/"
                            )
                        ) {
                            return (
                                <div className="w-full h-40 cursor-pointer relative" onClick={() => setSelectedFile(fullUrl)} key={file.id}>
                                    <video
                                        controls
                                        src={fullUrl}
                                        className="h-full rounded-xl w-full object-cover"
                                        onClick={() => setSelectedFile(fullUrl)}
                                    />
                                    <Play size={48} className="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                            );
                        }

                        if (
                            file.mimeType.startsWith(
                                "audio/"
                            )
                        ) {
                            return (
                                <audio
                                    key={file.id}
                                    controls
                                    src={fullUrl}
                                    onClick={() => setSelectedFile(fullUrl)}
                                />
                            );
                        }

                        if (
                            file.mimeType ===
                            "application/pdf"
                        ) {
                            return (
                                <div className="w-full h-40 cursor-pointer relative" onClick={() => setSelectedFile(fullUrl)} key={file.id}>
                                    <embed src={fullUrl} type="application/pdf" className="h-full w-full rounded-xl object-cover" onClick={() => setSelectedFile(fullUrl)} />
                                    <div className="absolute inset-0 flex items-center justify-center h-full w-full text-white bg-black/9">
                                        <File size={48} />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div className="w-full rounded-xl border bg-white p-4 shadow-sm h-40 cursor-pointer" key={file.id} onClick={() => setSelectedFile(fullUrl)}>
                                <div className="font-medium text-sm text-slate-500">
                                    {file.name}
                                </div>

                                <div className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                </div>
                                <div className="flex items-center justify-center">
                                    <File size={100} className="text-slate-500" />
                                </div>
                            </div>
                        );
                    }
                })}
                {attachments.length > 3 && (() => {
                    const fullUrl =
                        process.env.NEXT_PUBLIC_API_BASE_URL + attachments[3].url;

                    return (
                        <div
                            className="flex items-center justify-center h-40 rounded-xl border bg-white p-4 shadow-sm cursor-pointer"
                            onClick={() => setSelectedFile(fullUrl)}
                        >
                            <div className="text-4xl text-slate-500">
                                +{attachments.length - 3} more
                            </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );
}