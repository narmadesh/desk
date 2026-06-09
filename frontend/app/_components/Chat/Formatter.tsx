import Button from "../Button";
import {
  ALargeSmall,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  TextAlignCenter,
  TextAlignStart,
  TextAlignEnd,
  Undo,
  Redo,
} from "lucide-react";

export function Formatter({
  toggleFormattingToolbar,
  setToggleFormattingToolbar,
  formatting,
  toggleFormatting,
  format,
  insertLink,
}: {
  toggleFormattingToolbar: boolean;
  setToggleFormattingToolbar: (toggleFormattingToolbar: boolean) => void;
  formatting: string[];
  toggleFormatting: (formatting: string) => void;
  format: (formatting: string, text: string) => void;
  insertLink: () => void;
}) {
  return (
    <>
      <Button
        variant="tool"
        onClick={() => setToggleFormattingToolbar(!toggleFormattingToolbar)}
        active={toggleFormattingToolbar}
        tooltip="Formatting"
      >
        <ALargeSmall size={15} />
      </Button>
      <div
        className="absolute -top-10 z-10 flex items-center gap-2 rounded bg-gray-400 p-2 shadow"
        hidden={!toggleFormattingToolbar}
      >
        <Button
          className="font-bold"
          variant="tool"
          onClick={() => {
            format("bold", "");
            toggleFormatting("bold");
          }}
          active={formatting.includes("bold")}
        >
          <Bold size={15} />
        </Button>
        <Button
          className="italic"
          variant="tool"
          onClick={() => {
            format("italic", "");
            toggleFormatting("italic");
          }}
          active={formatting.includes("italic")}
        >
          <Italic size={15} />
        </Button>
        <Button
          className="underline"
          variant="tool"
          onClick={() => {
            format("underline", "");
            toggleFormatting("underline");
          }}
          active={formatting.includes("underline")}
        >
          <Underline size={15} />
        </Button>
        <Button
          className="line-through"
          variant="tool"
          onClick={() => {
            format("strikethrough", "");
            toggleFormatting("strikethrough");
          }}
          active={formatting.includes("strikethrough")}
        >
          <Strikethrough size={15} />
        </Button>
        |
        <Button
          className=""
          variant="tool"
          onClick={() => {
            insertLink();
            toggleFormatting("createLink");
          }}
          active={formatting.includes("createLink")}
        >
          <LinkIcon size={15} />
        </Button>
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("insertUnorderedList", "");
            toggleFormatting("insertUnorderedList");
          }}
          active={formatting.includes("insertUnorderedList")}
        >
          <List size={15} />
        </Button>
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("insertOrderedList", "");
            toggleFormatting("insertOrderedList");
          }}
          active={formatting.includes("insertOrderedList")}
        >
          <ListOrdered size={15} />
        </Button>
        |
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("justifyLeft", "");
            toggleFormatting("justifyLeft");
          }}
          active={formatting.includes("justifyLeft")}
        >
          <TextAlignStart size={15} />
        </Button>
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("justifyCenter", "");
            toggleFormatting("justifyCenter");
          }}
          active={formatting.includes("justifyCenter")}
        >
          <TextAlignCenter size={15} />
        </Button>
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("justifyRight", "");
            toggleFormatting("justifyRight");
          }}
          active={formatting.includes("justifyRight")}
        >
          <TextAlignEnd size={15} />
        </Button>
        |
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("undo", "");
            toggleFormatting("undo");
          }}
          active={formatting.includes("undo")}
        >
          <Undo size={15} />
        </Button>
        <Button
          className=""
          variant="tool"
          onClick={() => {
            format("redo", "");
            toggleFormatting("redo");
          }}
          active={formatting.includes("redo")}
        >
          <Redo size={15} />
        </Button>
      </div>
    </>
  );
}
