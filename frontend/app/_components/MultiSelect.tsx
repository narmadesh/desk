import React, { useState } from "react";

type Options = {
  label: string,
  value: string
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  options: Options[]
}

const MultiSelect: React.FC<InputProps> = ({ label, error, options, ...props }) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const selectItem = (value: string, label: string) => {
    if (selectedValues.includes(value)) {
      setSelectedLabels(prev => prev.filter(item => item !== label));
      setSelectedValues(prev => prev.filter(item => item !== value));
    }
    else {
      setSelectedLabels(prev => [...prev, label]);
      setSelectedValues(prev => [...prev, value]);
    }
  }

  const [searchText, setSearchText] = useState("");

  const filteredItems = options.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );
  return (
    <div className="flex w-full flex-col relative">
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {selectedLabels.join(',')}
      <input
        className={`rounded-md border px-3 py-2 focus:ring-2 focus:outline-none text-gray-700 ${error ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"} `}
        onChange={(e) => setSearchText(e.target.value)}
        {...props}
      />
      <ul className="bg-white shadow z-99 divide-y divide-gray-200 fixed w-1/2 top-50">
        {searchText.length > 0 && filteredItems.map((item, key) => {
          return (
            <li key={key} onClick={() => selectItem(item.value, item.label)} className="p-2 cursor-pointer text-slate-500 hover:bg-gray-200">{item.label}</li>
          )
        })}
      </ul>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default MultiSelect;
