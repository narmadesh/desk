import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import Button from "../Button";
import {
  ALargeSmall,
  Mic,
  Monitor,
  Plus,
  SendHorizontal,
  Square,
  Smile,
  VideoIcon,
  Image,
} from "lucide-react";
import { Formatter } from "./Formatter";
import { Emojis } from "./Emojis";
import VideoRecorderModal from "./VideoRecorderModal";
import ScreenRecorderModal from "./ScreenRecorderModal";
import AttachmentPreview from "./AttachmentPreview";

export function Footer({
  currentUser,
  sendMessage,
  messageInput,
  sendTyping,
  sendStopTyping,
  editorRef,
  saveContent,
  sendAudioMessage,
  sendVideoMessage,
  sendScreenRecording,
  sendFiles
}: {
  currentUser: { id: string; name: string };
  sendMessage: () => void;
  sendTyping: (id: string) => void;
  sendStopTyping: (id: string) => void;
  messageInput: string;
  editorRef: any;
  saveContent: () => void;
  sendAudioMessage?: (audioBlob: Blob, duration: number) => void;
  sendVideoMessage?: (
    videoBlob: Blob,
    duration: number
  ) => void;
  sendScreenRecording?: (
    blob: Blob,
    duration: number
  ) => void;
  sendFiles?: (files: File[]) => void;
}) {
  const [focus, setFocus] = useState(false);
  const [toggleFormattingToolbar, setToggleFormattingToolbar] = useState(false);
  const [formatting, setFormatting] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toggleFormatting = (value: string) => {
    if (formatting.includes(value)) {
      setFormatting(formatting.filter((f) => f !== value));
    } else {
      setFormatting([...formatting, value]);
    }
  };
  const format = (cmd: string, value: string | undefined) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (recordedAudio) {
        sendRecordedAudio();
      }
      else if (attachments.length) {
        sendFiles?.(attachments);

        setAttachments([]);
      }
      else {
        sendMessage();
      }
      sendStopTyping(currentUser.id);
    } else {
      sendTyping(currentUser.id);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter Image URL:");
    if (url) {
      document.execCommand("insertImage", false, url);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter The URL:");
    if (url) {
      format("createLink", url);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const duration =
          (Date.now() - recordingStartRef.current) / 1000;

        setRecordedAudio(audioBlob);
        setAudioPreviewUrl(URL.createObjectURL(audioBlob));
        setAudioDuration(duration);

        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendRecordedAudio = () => {
    if (!recordedAudio) return;

    sendAudioMessage?.(
      recordedAudio,
      audioDuration
    );

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setRecordedAudio(null);
    setAudioPreviewUrl(null);
    setAudioDuration(0);
  };

  const removeRecordedAudio = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setRecordedAudio(null);
    setAudioPreviewUrl(null);
    setAudioDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files?.length) return;

    setAttachments((prev) => [
      ...prev,
      ...Array.from(files),
    ]);

    event.target.value = "";
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };
  return (
    <>
      <div className="relative border-t border-t-[#e5e7eb] bg-transparent px-5 py-3">
        {audioPreviewUrl && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <audio
              controls
              src={audioPreviewUrl}
              className="flex-1"
            />

            <button
              onClick={removeRecordedAudio}
              className="rounded bg-red-500 px-3 py-1 text-white"
            >
              Delete
            </button>
          </div>
        )}
        <AttachmentPreview
          files={attachments}
          onRemove={removeAttachment}
        />
        <div className="relative flex items-center gap-0">
          <div
            className={`relative h-13 w-full overflow-auto rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-[#0f172a] outline-none ${formatting.includes('insertUnorderedList') ? 'list-disc list-inside' : ''} ${formatting.includes('insertOrderedList') ? 'list-decimal list-inside' : ''}`}
            id="editor"
            contentEditable={true}
            ref={editorRef}
            onInput={saveContent}
            onKeyUp={() => sendStopTyping(currentUser.id)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            data-placeholder={`Message ${currentUser.name}`}
          >
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 py-2 text-[#0f172a]">
          <div className="flex items-center gap-2">
            <Button variant="tool" tooltip="Insert Attachment" onClick={() => imageInputRef.current?.click()}>
              <Image size={15} />
            </Button>
            <Formatter
              toggleFormattingToolbar={toggleFormattingToolbar}
              setToggleFormattingToolbar={setToggleFormattingToolbar}
              formatting={formatting}
              toggleFormatting={toggleFormatting}
              format={format}
              insertLink={insertLink}
            />
            <Emojis editorRef={editorRef} saveContent={saveContent} />
            <Button variant="tool" tooltip="Share Screen" onClick={() => setScreenModalOpen(true)}>
              <Monitor size={15} />
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`cursor-pointer ${isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : ""
                }`}
              title={isRecording ? "Stop recording" : "Start recording"}
              variant="tool"
              tooltip="Record Audio Clip"
            >
              {isRecording ? (
                <>
                  <Square size={15} fill="currentColor" />
                  <span className="text-xs font-semibold">{formatTime(recordingTime)}</span>
                </>
              ) : (
                <Mic size={15} />
              )}
            </Button>
            <Button variant="tool" tooltip="Record Video Clip" onClick={() => setVideoModalOpen(true)}>
              <VideoIcon size={15} />
            </Button>
            <input
              multiple
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.android.package-archive,application/zip,application/x-zip-compressed"
              className="hidden"
              type="file"
              ref={imageInputRef}
              onChange={handleFileChange}
            />
          </div>
          <button
            className={`${!messageInput.trim() && !recordedAudio && attachments.length === 0 ? "bg-[#cbd5e1] text-white" : "cursor-pointer bg-[#0f172a] text-white"} rounded-lg border-0 px-3 py-1 font-bold`}
            disabled={
              !messageInput.trim() &&
              !recordedAudio && attachments.length === 0
            }
            onClick={(e) => {
              e.preventDefault();
              if (recordedAudio) {
                sendRecordedAudio();
              }
              else if (attachments.length) {
                sendFiles?.(attachments);

                setAttachments([]);
              }
              else {
                sendMessage();
              }
            }}
          >
            <SendHorizontal size={20} fill="white" />
          </button>
        </div>
      </div>
      <VideoRecorderModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onSend={(blob, duration) =>
          sendVideoMessage?.(blob, duration)
        }
      />
      <ScreenRecorderModal
        open={screenModalOpen}
        onClose={() =>
          setScreenModalOpen(false)
        }
        onSend={(blob, duration) =>
          sendScreenRecording?.(
            blob,
            duration
          )
        }
      />
    </>
  );
}
