"use client";
import { useEffect, useState, useRef } from "react";
import { sendMessage, sendReaction, sendTyping, sendStopTyping, sendReadReceipt, getMessageCount } from "@/utils/socket";
import { Tab } from "../_components/Chat/Tab";
import { UsersList } from "../_components/Chat/UsersList";
import { Header } from "../_components/Chat/Header";
import { Body } from "../_components/Chat/Body";
import { Footer } from "../_components/Chat/Footer";
import axiosInstance from "@/utils/axios";
import { useSession } from "@/context/SessionContext";
import { User } from "@/schema/user";
import { useSocket } from "@/context/SocketContext";
import { ChannelsList } from "../_components/Chat/ChannelsList";
import { ChatMessage } from "@/schema/chat-message";
import ChannelModal from "../_components/Chat/ChannelModal";
import ChannelInfoModal from "../_components/Chat/ChannelInfoModal";
import DeleteModal from "../_components/Chat/DeleteModal";
import toast from "react-hot-toast";

export default function Home() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<any>([]);
  const [tab, setTab] = useState("chat");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>({});
  const [messageInput, setMessageInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<any>({});
  const [typingUsers, setTypingUsers] = useState<any>({});
  const [userMessageCount, setUserMessageCount] = useState<any>({});
  const [htmlOutput, setHtmlOutput] = useState("");
  const [plainOutput, setPlainOutput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [messageSkip, setMessageSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [addChannel, setAddChannel] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberId, setMemberId] = useState<string>("");
  const { profile } = useSession();
  const socket = useSocket();

  const getUsers = () => {
    if (tab == 'chat') {
      axiosInstance.get('/api/users').then(function (resp) {
        if (resp.data.users && resp.data.users.length > 0) {
          setUsers(resp.data.users.filter((u: User) => u.id != profile?.id));
          resp.data.users.filter((u: any) => u.online == true).map((u: User) => setOnlineUsers((prev: any) => ({ ...prev, [u.id]: true })));
          if (!currentUser || !currentUser.id) {
            setCurrentUser(resp.data.users.filter((u: User) => u.id != profile?.id)[0]);
          }
        }
      })
    }

    if (tab == 'channels') {
      axiosInstance.get('/api/group').then(function (resp) {
        if (resp.data.groups) {
          setUsers(resp.data.groups);
          if (!currentUser || !currentUser.id && resp.data.groups.length > 0) {
            setCurrentUser(resp.data.groups[0]);
          }
        }
      })
    }
  }

  useEffect(() => {
    if (!socket) return;
    console.log('[client] socket present', { id: socket.id, connected: socket.connected });
    console.log('[client] registering socket handlers');
    getUsers();
    getMessageCount();
    socket.on("user:online", (id: string) => {
      setOnlineUsers((prev: any) => ({ ...prev, [id]: true }));
    });
    socket.on("user:offline", (id: string) => {
      setOnlineUsers((prev: any) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    });
    socket.on("message:count", (payload: any) => {
      setUserMessageCount(payload);
    });

    socket.on("typing", (otherUserId: string) => {
      setTypingUsers((prev: any) => ({ ...prev, [otherUserId]: Date.now() }));
    });

    socket.on("stop_typing", (otherUserId: string) => {
      setTypingUsers((prev: any) => {
        const n = { ...prev };
        delete n[otherUserId];
        return n;
      });
    });
    socket.on("group:new", () => {
      getUsers();
    });
    socket.on("member:new", () => {
      getUsers();
    });
    socket.on("message:new", (payload: any) => {
      console.log('[client] received message:new', { payload, currentUserId: currentUser?.id });
      if (!payload?.id) {
        console.log('[client] message:new missing id, payload will be inspected', payload);
        // continue to attempt to process payload even if id missing
      }
      if (tab == 'chat' && payload.to !== profile?.id && payload.from?.id !== profile?.id) return;

      getMessageCount()
      const incomingId = payload.id ?? payload.tempId ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const incoming: ChatMessage = {
        id: incomingId,
        message: payload.message ?? payload.content ?? "",
        plainText: payload.message ?? payload.content ?? "",
        voiceUrl: payload.voiceUrl ?? null,
        videoUrl: payload.videoUrl ?? null,
        screenRecordingUrl: payload.screenRecordingUrl ?? null,
        messageType: payload.messageType ?? "",
        from: {
          id: payload.from?.id,
          name: payload.from?.name,
        },
        to: payload.to,
        timestamp: payload.timestamp,
        read: payload.read ?? false,
        replyTo: payload.replyTo
          ? {
            id: payload.replyTo.id,
            message: payload.replyTo.message,
            from: {
              id: payload.replyTo.from.id,
              name: payload.replyTo.from.name,
            },
          }
          : null,
        reactions: payload.reactions ?? [],
        attachments: payload.attachments ?? [],
      };

      setMessages((prev) => {
        // Already received this message
        if (prev.some((m) => m.id === incoming.id)) {
          return prev;
        }

        // Replace optimistic message if found
        if (payload.tempId) {
          const tempExists = prev.some((m) => m.id === payload.tempId);

          if (tempExists) {
            return prev.map((m) =>
              m.id === payload.tempId
                ? { ...incoming, read: m.read ?? incoming.read }
                : m
            );
          }
        }

        // Recipient side or no temp message found
        return [...prev, incoming];
      });

      if (payload.from?.id === currentUser?.id && payload.to === profile?.id) {
        console.log('[client] sending read receipt', { otherUserId: currentUser.id, tempId: payload.tempId });
        sendReadReceipt({ otherUserId: currentUser.id, tempId: payload.tempId });
        setTimeout(function () {
          getMessageCount()
        }, 1000);
      }
    });

    socket.on("message:reaction", (payload: any) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === payload.messageId
            ? { ...message, reactions: payload.reactions }
            : message,
        ),
      );
    });

    socket.on("message:read", (payload: any) => {
      console.log('[client] received message:read', { payload, currentUserId: currentUser?.id });
      if (!payload?.messageIds && !payload?.tempId) return;
      setMessages((prev) =>
        prev.map((message) =>
          payload.messageIds?.includes(message.id) || payload.tempId === message.id
            ? { ...message, read: true }
            : message,
        ),
      );
    });

    return () => {
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("message:new");
      socket.off("message:reaction");
      socket.off("message:read");
      socket.off("message:count");
    };
  }, [socket, currentUser, profile]);

  const mapMessage = (message: any): ChatMessage => ({
    id: message.id,
    message: message.content ?? message.message,
    plainText: message.content ?? message.message,
    from: {
      id: message.sender?.id,
      name: message.sender?.name,
    },
    to: message.receiverId ?? message.to,
    timestamp: message.createdAt ?? message.timestamp,
    read: message.read ?? false,
    voiceUrl: message.voiceUrl,
    videoUrl: message.videoUrl,
    screenRecordingUrl: message.screenRecordingUrl,
    messageType: message.messageType,
    replyTo: message.replyTo
      ? {
        id: message.replyTo.id,
        message: message.replyTo.content,
        from: {
          id: message.replyTo.sender.id,
          name: message.replyTo.sender.name,
        },
      }
      : null,
    reactions: message.reactions?.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      user: {
        id: reaction.user.id,
        name: reaction.user.name,
      },
    })) ?? [],
    attachments: message.attachments?.map((attachment: any) => ({
      id: attachment.id,
      name: attachment.name,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })) ?? [],
  });

  useEffect(() => {
    if (!currentUser?.id || !profile?.id) return;
    setMessageSkip(0);
    setHasMore(true);
    setIsLoadingMessages(true);
    axiosInstance
      .get(`/api/messages/conversation/${currentUser.id}`, {
        params: { limit: 10, skip: 0 },
      })
      .then((resp) => {
        const fetched: ChatMessage[] = resp.data.messages.map(mapMessage);
        setMessages(fetched);
        setHasMore(resp.data.hasMore);
        getMessageCount();
      })
      .catch(() => {
        setMessages([]);
        setHasMore(false);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [currentUser?.id, profile?.id]);

  const loadMoreMessages = () => {
    if (!currentUser?.id || !profile?.id || isLoadingMessages || !hasMore && messages.length < 10) return;
    setIsLoadingMessages(true);
    const nextSkip = messageSkip + 10;
    axiosInstance
      .get(`/api/messages/conversation/${currentUser.id}`, {
        params: { limit: 10, skip: nextSkip },
      })
      .then((resp) => {
        const fetched: ChatMessage[] = resp.data.messages.map(mapMessage);
        setMessages((prev) => [...fetched, ...prev]);
        setMessageSkip(nextSkip);
        setHasMore(resp.data.hasMore);
      })
      .catch(() => {
        setHasMore(false);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  };

  const saveContent = () => {
    if (!editorRef.current) return;
    setHtmlOutput(editorRef.current.innerHTML);
    setPlainOutput(editorRef.current.innerText);
    setMessageInput(editorRef.current.innerText);
  };

  const sendMsg = () => {
    if (!messageInput.trim() || !htmlOutput || !profile?.id || !currentUser?.id) return;

    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const outgoing: ChatMessage = {
      id: tempId,
      message: htmlOutput || messageInput,
      plainText: plainOutput || messageInput,
      from: {
        id: profile.id,
        name: profile.name as string,
      },
      to: currentUser.id,
      timestamp: new Date().toISOString(),
      read: false,
      replyTo: replyTo
        ? {
          id: replyTo.id,
          message: replyTo.message,
          from: replyTo.from,
        }
        : null,
      reactions: [],
    };

    setMessages((prev) => [...prev, outgoing]);
    sendMessage({
      tempId,
      message: outgoing.message,
      to: outgoing.to,
      replyToId: replyTo?.id,
    });
    setMessageInput("");
    setHtmlOutput("");
    setPlainOutput("");
    setReplyTo(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const sendAudioMsg = (audioBlob: Blob, duration: number) => {
    if (!profile?.id || !currentUser?.id) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, `audio-${Date.now()}.webm`);
    formData.append('to', currentUser.id);
    formData.append('duration', duration.toString());
    formData.append('message', htmlOutput || messageInput || `🎙️ Audio message (${Math.floor(duration)}s)`);

    // Upload audio file via API
    axiosInstance.post(`/api/messages/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => {
      const savedMessage = response.data;
      setMessageInput("");
      setHtmlOutput("");
      setPlainOutput("");
      setReplyTo(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }).catch((err) => {
      console.error('Error uploading audio:', err);
    });
  };

  const sendVideoMsg = (
    videoBlob: Blob,
    duration: number
  ) => {
    if (!profile?.id || !currentUser?.id) return;

    const formData = new FormData();

    formData.append(
      "video",
      videoBlob,
      `video-${Date.now()}.webm`
    );

    formData.append("to", currentUser.id);

    formData.append(
      "duration",
      duration.toString()
    );
    formData.append('message', htmlOutput || messageInput || `📽️ Video message (${Math.floor(duration)}s)`);

    axiosInstance.post(`/api/messages/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => {
      const savedMessage = response.data;
      setMessageInput("");
      setHtmlOutput("");
      setPlainOutput("");
      setReplyTo(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }).catch((err) => {
      console.error('Error uploading video:', err);
    });
  };

  const sendScreenRecording = (
    blob: Blob,
    duration: number
  ) => {
    const formData = new FormData();

    formData.append(
      "screenRecording",
      blob,
      `screen-${Date.now()}.webm`
    );

    formData.append(
      "to",
      currentUser.id
    );

    formData.append(
      "duration",
      duration.toString()
    );

    formData.append('message', htmlOutput || messageInput || `📽️ Screen recording (${Math.floor(duration)}s)`);

    axiosInstance.post(
      "/api/messages/screen-recording",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ).then((response) => {
      const savedMessage = response.data;
      setMessageInput("");
      setHtmlOutput("");
      setPlainOutput("");
      setReplyTo(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }).catch((err) => {
      console.error('Error uploading screen recording:', err);
    });
  };

  const sendFiles = async (
    files: File[]
  ) => {
    if (!currentUser?.id) return;

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append(
      "to",
      currentUser.id
    );

    formData.append('message', htmlOutput || messageInput);

    try {
      await axiosInstance.post(
        "/api/messages/files",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      ).then((response) => {
        const savedMessage = response.data;
        setMessageInput("");
        setHtmlOutput("");
        setPlainOutput("");
        setReplyTo(null);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }).catch((err) => {
        console.error('Error uploading files:', err);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const removeChannel = async () => {
    const response = await axiosInstance.delete('/api/group/' + currentUser.id);
    if (response.data.success) {
      toast.success(response.data.message);
      setShowInfoModal(false);
      setShowDeleteChannelModal(false);
      setCurrentUser({});
    }
    else {
      toast.error(response.data.message);
    }
  }

  const removeMember = async () => {
    const response = await axiosInstance.delete('/api/group/member/' + currentUser.id + '/' + memberId);
    if (response.data.success) {
      toast.success(response.data.message);
      setShowInfoModal(false);
      setShowDeleteMemberModal(false);
      setMemberId("");
    }
    else {
      toast.error(response.data.message);
    }
  }

  const filteredMessages = messages
    .filter(
      (msg) =>
        msg.to === currentUser?.id || msg.from.id === currentUser?.id,
    )
    .filter((msg) => {
      if (!messageSearch.trim()) return true;
      const searchLower = messageSearch.toLowerCase();
      return (
        msg.message.toLowerCase().includes(searchLower) ||
        msg.plainText.toLowerCase().includes(searchLower)
      );
    });

  return (
    <main className="grid grid-cols-[60px_300px_1fr]">
      <Tab tab={tab} setTab={setTab} session={profile} setCurrentUser={setCurrentUser} />
      {tab == "chat" ? (
        <UsersList
          search={search}
          setSearch={setSearch}
          users={users}
          session={profile}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          typingUsers={typingUsers}
          onlineUsers={onlineUsers}
          userMessageCount={userMessageCount}
        />
      ) : null}
      {tab == "channels" ? (
        <ChannelsList
          search={search}
          setSearch={setSearch}
          users={users}
          session={profile}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setAddChannel={setAddChannel}
          typingUsers={typingUsers}
          onlineUsers={onlineUsers}
          userMessageCount={userMessageCount}
        />
      ) : null}
      <div className="flex h-screen flex-col bg-white">
        {currentUser && currentUser.name && (
          <>
            <Header currentUser={currentUser} typingUsers={typingUsers} setShowSearch={setShowSearch} showSearch={showSearch} tab={tab} profile={profile} setShowInfoModal={setShowInfoModal} setShowDeleteChannelModal={setShowDeleteChannelModal} />
            {showSearch && <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-6 py-3">
              <input
                type="text"
                placeholder="Search in conversation..."
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>}
            <div className="flex flex-1 flex-col">
              <Body
                messages={filteredMessages}
                sessionUserId={profile?.id ?? ""}
                currentUserId={currentUser?.id}
                onReply={setReplyTo}
                onReact={(messageId: string, emoji: string) =>
                  sendReaction({ messageId, emoji, to: currentUser.id })
                }
                onLoadMore={loadMoreMessages}
                isLoading={isLoadingMessages}
                hasMore={hasMore}
              />
              {replyTo ? (
                <div className="mx-5 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Replying to <strong>{replyTo.from.name}</strong>: {replyTo.message}
                  <button
                    className="ml-4 rounded bg-slate-200 px-2 py-1 text-xs text-slate-700"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              <Footer
                currentUser={currentUser}
                sendMessage={sendMsg}
                messageInput={messageInput}
                sendTyping={sendTyping}
                sendStopTyping={sendStopTyping}
                editorRef={editorRef}
                saveContent={saveContent}
                sendAudioMessage={sendAudioMsg}
                sendVideoMessage={sendVideoMsg}
                sendScreenRecording={sendScreenRecording}
                sendFiles={sendFiles}
              />
            </div>
          </>
        )}
      </div>
      {addChannel ? <ChannelModal setAddChannel={setAddChannel} getUsers={getUsers} setCurrentUser={setCurrentUser} /> : null}
      {showInfoModal ? <ChannelInfoModal setShowInfoModal={setShowInfoModal} currentUser={currentUser} setCurrentUser={setCurrentUser} setMemberId={setMemberId} setShowDeleteMemberModal={setShowDeleteMemberModal} /> : null}
      {showDeleteChannelModal ? <DeleteModal title="Are you sure" text="You want to remove this channel" setShowDeleteModal={setShowDeleteChannelModal} currentUser={currentUser} setCurrentUser={setCurrentUser} onClick={() => removeChannel()} /> : null}
      {showDeleteMemberModal ? <DeleteModal title="Are you sure" text="You want to remove this member" setShowDeleteModal={setShowDeleteMemberModal} currentUser={currentUser} setCurrentUser={setCurrentUser} onClick={() => removeMember()} /> : null}
    </main>
  );
}