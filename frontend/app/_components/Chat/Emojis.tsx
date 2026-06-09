import { Smile } from "lucide-react";
import Button from "../Button";

import { useEffect, useState } from "react";
import Input from "../Input";

export function Emojis({editorRef,saveContent}:{editorRef:any;saveContent:()=>void}) {
  const [emojiList, setEmojiList] = useState<any>({});
  const [emojiSearch, setEmojiSearch] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fetchEmojis = async () => {
    const res = await fetch("https://unpkg.com/emoji.json/emoji.json");
    const data = await res.json();
    const grouped = data.reduce((acc: any, emoji: any) => {
      const grp = emoji.group || "Unknown";
      if (!acc[grp]) {
        acc[grp] = [];
      }
      acc[grp].push(emoji);
      return acc;
    }, {});

    return grouped;
  };
  const insertEmoji = (emoji: any) => {
    editorRef.current.innerText += emoji;
    setShowEmoji(!showEmoji);
    saveContent();
    // const selection = window.getSelection();
    // if (!selection || !selection.rangeCount) return;

    // const range = selection.getRangeAt(0);
    // range.deleteContents();
    // range.insertNode(document.createTextNode(emoji));

    // // move cursor after emoji
    // range.collapse(false);
    // selection.removeAllRanges();
    // selection.addRange(range);
  };
  return (
    <>
      <Button
        variant="tool"
        onClick={() => {
          setShowEmoji(!showEmoji);
          if (!emojiList || Object.keys(emojiList).length <= 0) {
            fetchEmojis().then((res) => setEmojiList(res));
          }
        }}
        active={showEmoji}
        tooltip="Insert Emoji"
      >
        <Smile size={15} />
      </Button>
      <div
        className="absolute -top-96 z-10 flex flex-col w-96 items-center gap-2 rounded bg-white p-2 shadow"
        hidden={!showEmoji}
      >
        <Input
          type="text"
          value={emojiSearch}
          onChange={(e) => setEmojiSearch(e.target.value)}
          className="rounded border border-gray-500 px-2 py-1 hover:border-gray-600"
          placeholder="Search emoji"
        />
        <div className="flex flex-col divide-y h-80 overflow-auto gap-2">
          {emojiList &&
            Object.keys(emojiList).filter((u:string) => u.toLowerCase().includes(emojiSearch.toLowerCase())).map(function (emoji) {
              return (
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-bold">{emoji}</div>
                  <div className="flex gap-1 flex-wrap items-center">
                    {emojiList[emoji].filter((u:any) => u.name.toLowerCase().includes(emojiSearch.toLowerCase())).map(function (emojiItem: any) {
                    return (
                      <div
                        className="cursor-pointer text-lg"
                        onClick={() => insertEmoji(emojiItem.char)}
                      >
                        {emojiItem.char}
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
