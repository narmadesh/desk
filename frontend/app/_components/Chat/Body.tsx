"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import AttachmentRenderer from "./AttachmentRenderer";
import AttachmentViewer from "./AttachmentViewer";
import { sendReadReceipt } from "@/utils/socket";

type ChatMessage = {
  id: string;
  tempId?: string;
  message: string;
  plainText: string;
  from: {
    id: string;
    name: string;
  };
  to: string;
  timestamp: string;
  read?: boolean;
  voiceUrl?: string;
  videoUrl?: string;
  messageType?:string;
  screenRecordingUrl?: string;
  replyTo?: {
    id: string;
    message: string;
    from: {
      id: string;
      name: string;
    };
  } | null;
  reactions?: {
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string;
    };
  }[];
  attachments?: {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
  }[];
};

const reactions = ["❤️", "😂", "👍", "😮", "😢", "👏"];

// Audio Player Component
function AudioPlayer({ voiceUrl }: { voiceUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error('Playback error:', err);
          setError('Failed to play audio');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setError(null);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    console.error('Audio load error:', audioRef.current?.error);
    const errorMsg = audioRef.current?.error?.message || 'Unable to load audio file';
    setError(errorMsg);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-2 text-xs text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2">
      <audio
        ref={audioRef}
        src={voiceUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        crossOrigin="anonymous"
      />
      <button
        onClick={togglePlay}
        className="shrink-0 rounded-full p-2 hover:bg-slate-200 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-slate-600" />
        ) : (
          <Play className="w-5 h-5 text-slate-600" />
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #64748b 0%, #64748b ${(currentTime / duration) * 100}%, #cbd5e1 ${(currentTime / duration) * 100}%, #cbd5e1 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

type Attachment = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export function Body({
  messages,
  sessionUserId,
  currentUserId,
  onReply,
  onReact,
  onLoadMore,
  isLoading = false,
  hasMore = false,
}: {
  messages: ChatMessage[];
  sessionUserId: string;
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [slider, setShowSlider] = useState<any[]>([]);

  // Scroll to bottom when new message arrives (but not when loading older messages)
  const initialScrollDone = useRef(false);

  useEffect(() => {
    initialScrollDone.current = false;
  }, [currentUserId]);

  useEffect(() => {
    if (!messages.length || initialScrollDone.current) return;

    requestAnimationFrame(() => {
      if (!divRef.current) return;

      divRef.current.scrollTop = divRef.current.scrollHeight;
      initialScrollDone.current = true;
    });
  }, [messages, currentUserId]);

  useEffect(() => {
    const files = messages.flatMap((message) => [
      ...(message.videoUrl
        ? [
          {
            id: `${message.id}-video`,
            url:
              process.env.NEXT_PUBLIC_API_BASE_URL +
              message.videoUrl,
            name: "Video",
            mimeType: "video/mp4",
          },
        ]
        : []),

      ...(message.screenRecordingUrl
        ? [
          {
            id: `${message.id}-recording`,
            url:
              process.env.NEXT_PUBLIC_API_BASE_URL +
              message.screenRecordingUrl,
            name: "Screen Recording",
            mimeType: "video/mp4",
          },
        ]
        : []),

      ...(message.attachments || []).map((file) => ({
        id: file.id,
        url:
          process.env.NEXT_PUBLIC_API_BASE_URL +
          file.url,
        name: file.name,
        mimeType: file.mimeType,
      })),
    ]);
    setShowSlider(files);

  }, [messages]);

  // Handle scroll to top for loading older messages
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!divRef.current || isLoading || !hasMore) return;

      const scrollTop = divRef.current.scrollTop;
      const scrollThreshold = 100; // Load when within 100px of top

      if (scrollTop < scrollThreshold && onLoadMore && messages.length > 10) {
        onLoadMore();
      }
    }, 200); // Debounce scroll events
  };
  const handleClose = () => {
    document.querySelectorAll("video").forEach((video) => {
      video.pause();
      video.currentTime = 0; // optional
    });

    setSelectedFile(null);
  };
  return (
    <>
      <div
        className="flex flex-1 basis-0 shrink flex-col gap-2 overflow-auto bg-[#f7fafc] bg-[radial-gradient(circle_at_0_0,rgba(31,41,55,0.06)_2px,transparent_2px),radial-gradient(circle_at_12px_12px,rgba(31,41,55,0.06)_2px,transparent_2px)] bg-size-[24px_24px] px-6 py-4"
        ref={divRef}
        onScroll={handleScroll}
      >
        <div className="flex flex-col gap-3">
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="text-sm text-slate-500">Loading older messages...</div>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center text-sm text-slate-500">
              Start the conversation by sending a message.
            </div>
          ) : (
            messages.map((message) => {
              if(!message.read){
                sendReadReceipt({ otherUserId: currentUserId, tempId: message.tempId });
              }
              const isMine = message.from.id === sessionUserId;
              if(message.messageType && message.messageType == 'info'){
                return(
                  <div className="flex items-center justify-center text-slate-500" key={message.id}>
                      {message.message}
                  </div>
                )
              }
              return (
                <div key={message.id} className="flex flex-col gap-2">
                  <div
                    className={`min-w-[30%] max-w-[50%] rounded-3xl p-3 shadow-sm bg-white text-slate-900 ${isMine ? "self-end" : "self-start"
                      }`}
                  >
                    <div className="mb-1 text-xs uppercase tracking-[0.15em] text-slate-500">
                      {isMine ? "You" : message.from.name}
                    </div>
                    {message.replyTo ? (
                      <div className="mb-2 rounded-2xl border border-slate-200 bg-slate-100 p-2 text-xs text-slate-700">
                        Replying to <strong>{message.replyTo.from.name}</strong>: {message.replyTo.message}
                      </div>
                    ) : null}
                    {message.videoUrl ? (
                      <div className="w-full cursor-pointer relative" onClick={() => setSelectedFile((process.env.NEXT_PUBLIC_API_BASE_URL + '' + message?.videoUrl) as string)}>
                        <video
                          controls
                          className="max-h-100 rounded-xl"
                          src={
                            process.env.NEXT_PUBLIC_API_BASE_URL +
                            message.videoUrl
                          }
                        />
                        <div className="absolute inset-0 flex items-center justify-center h-full w-full text-white bg-black/9">
                          <Play size={48} />
                        </div>
                      </div>
                    ) : null}
                    {message.voiceUrl ? (
                      <AudioPlayer
                        voiceUrl={
                          process.env.NEXT_PUBLIC_API_BASE_URL +
                          message.voiceUrl
                        }
                      />
                    ) : null}
                    {message.screenRecordingUrl ? (
                      <div className="w-full cursor-pointer relative" onClick={() => setSelectedFile((process.env.NEXT_PUBLIC_API_BASE_URL + '' + message?.screenRecordingUrl) as string)}>
                        <video
                          controls
                          className="max-h-100 rounded-xl"
                          src={
                            process.env.NEXT_PUBLIC_API_BASE_URL +
                            message.screenRecordingUrl
                          }
                        />
                        <div className="absolute inset-0 flex items-center justify-center h-full w-full text-white bg-black/9">
                          <Play size={48} />
                        </div>
                      </div>
                    ) : null}
                    {message.attachments?.length ? (
                      <AttachmentRenderer
                        attachments={
                          message.attachments
                        }
                        setSelectedFile={setSelectedFile}
                      />
                    ) : null}
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: message.message,
                      }}
                    />
                    {message.reactions && message.reactions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                        {message.reactions.map((reaction) => (
                          <span key={reaction.id} className="rounded-full bg-slate-200 px-2 py-1">
                            {reaction.emoji} {reaction.user.id === sessionUserId ? "You" : reaction.user.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {isMine && message.read ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                            Seen
                          </span>
                        ) : null}
                        <button
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200"
                          onClick={() => onReply(message)}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                        onClick={() => onReact(message.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {selectedFile && (
        <AttachmentViewer
          files={slider}
          initialIndex={slider.findIndex((file) => file.url == selectedFile)}
          onClose={handleClose}
        />
      )}
    </>
  );
}
