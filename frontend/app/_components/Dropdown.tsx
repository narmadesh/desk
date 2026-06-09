"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownItem {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  placeholder?: string;
  onSelect?: (item: DropdownItem) => void;
  children:React.ReactNode
}

export default function Dropdown({
  items,
  placeholder = "Select an option",
  onSelect,
  children
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<DropdownItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (item: DropdownItem) => {
    setSelected(item);
    setIsOpen(false);
    onSelect?.(item);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative max-w-64 inline-block text-left"
    >
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {children}
      </div>
      {isOpen && (
        <ul className="absolute z-10 mt-2 w-64 -left-60 rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.map((item,key) => (
            <li
              key={key}
              onClick={() => item.onClick()}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-slate-500"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}