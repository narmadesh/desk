"use client";

import { File } from "lucide-react";
import { useEffect } from "react";

type Props = {
    files: File[];
    onRemove: (index: number) => void;
};

export default function AttachmentPreview({
    files,
    onRemove,
}: Props) {
    useEffect(() => {
        const urls = files.map(file =>
            URL.createObjectURL(file)
        );

        return () => {
            urls.forEach(URL.revokeObjectURL);
        };
    }, [files]);
    return (
        <div className="mb-3 flex flex-wrap gap-3">
            {files.map((file, index) => {
                const isImage =
                    file.type.startsWith("image/");

                const isVideo =
                    file.type.startsWith("video/");

                const isAudio =
                    file.type.startsWith("audio/");
                const isPDF =
                    file.type.includes("application/pdf");

                const previewUrl =
                    URL.createObjectURL(file);

                return (
                    <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border bg-white p-2 shadow-sm"
                    >
                        {isImage ? (
                            <img
                                src={previewUrl}
                                alt={file.name}
                                className="h-28 w-28 rounded object-cover"
                            />
                        ) : isVideo ? (
                            <video
                                src={previewUrl}
                                className="h-28 w-40 rounded"
                            />
                        ) : isAudio ? (
                            <audio
                                controls
                                src={previewUrl}
                            />
                        ) : isPDF ? (
                            <embed src={previewUrl} type="application/pdf" className="h-28 w-40 rounded" />
                        ) : (
                            <div className="w-52">
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
                        )}

                        <button
                            onClick={() => onRemove(index)}
                            className="absolute right-1 top-1 h-6 w-6 rounded-full bg-red-500 text-white cursor-pointer"
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}