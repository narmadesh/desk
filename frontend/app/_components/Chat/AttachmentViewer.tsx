"use client";

import { X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
    Navigation,
    Pagination,
    Keyboard,
    Mousewheel,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Attachment = {
    id: string;
    url: string;
    name: string;
    mimeType: string;
};

type ViewerFile = {
    id: string;
    url: string;
    name: string;
    mimeType: string;
};

interface Props {
    files: ViewerFile[];
    initialIndex: number;
    onClose: () => void;
}

export default function AttachmentViewer({
    files,
    initialIndex,
    onClose,
}: Props) {
    return (
        <div className="fixed inset-0 z-50 bg-black/95">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white cursor-pointer"
            >
                <X size={24} />
            </button>

            <Swiper
                initialSlide={initialIndex}
                modules={[
                    Navigation,
                    Pagination,
                    Keyboard,
                    Mousewheel,
                ]}
                navigation
                pagination={{ clickable: true }}
                keyboard
                mousewheel
                className="h-screen w-screen"
            >
                {files.map((file) => (
                    <SwiperSlide
                        key={file.id}
                        className="flex items-center justify-center"
                    >
                        <div className="flex h-full w-full items-center justify-center p-8">
                            {renderFile(file)}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

function renderFile(file: ViewerFile) {
    if (file.mimeType.startsWith("image/")) {
        return (
            <img
                src={file.url}
                alt={file.name}
                className="max-h-full max-w-full object-contain"
            />
        );
    }

    if (file.mimeType.startsWith("video/")) {
        return (
            <video
                controls
                className="max-h-full max-w-full"
            >
                <source src={file.url} />
            </video>
        );
    }

    if (file.mimeType.startsWith("audio/")) {
        return (
            <div className="rounded-lg bg-white p-8">
                <h2 className="mb-4 text-black">{file.name}</h2>
                <audio controls>
                    <source src={file.url} />
                </audio>
            </div>
        );
    }

    if (file.mimeType === "application/pdf") {
        return (
            <iframe
                src={file.url}
                title={file.name}
                className="h-[90vh] w-[90vw] rounded bg-white"
            />
        );
    }

    return (
        <div className="text-center text-white">
            <h6 className="mb-2 text-lg font-semibold text-white">{file.name}</h6>
            <p>Preview unavailable</p>
            <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block underline"
            >
                Open file
            </a>
        </div>
    );
}