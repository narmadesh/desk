export type ChatMessage = {
  id: string;
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
  screenRecordingUrl?: string;
  messageType?: string;
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
