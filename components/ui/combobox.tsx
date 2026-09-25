// bm-design-system: combobox primitive
"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";

export interface ComboboxOption {
  id: string;
  label: string;
  href: string;
}

export interface ComboboxProps
  extends Omit<InputProps, "value" | "onChange" | "type" | "onSelect"> {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (option: ComboboxOption) => void;
  emptyMessage?: string;
  maxResults?: number;
}

const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      onSelect,
      emptyMessage = "No results found",
      maxResults = 8,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const results = React.useMemo(() => {
      const q = value.trim().toLowerCase();
      if (!q) return [];
      return options
        .filter((o) => o.label.toLowerCase().includes(q))
        .slice(0, maxResults);
    }, [options, value, maxResults]);

    React.useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function handleSelect(option: ComboboxOption) {
      setOpen(false);
      onSelect?.(option);
    }

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => value.trim() && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              handleSelect(results[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(className)}
          {...props}
        />
        {open && value.trim() && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-hairline bg-page shadow-sm">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-ink-muted">
                {emptyMessage}
              </p>
            ) : (
              <ul className="flex flex-col">
                {results.map((option) => (
                  <li key={option.id}>
                    <Link
                      href={option.href}
                      onClick={() => handleSelect(option)}
                      className="block px-3 py-2 text-sm no-underline hover:bg-surface"
                    >
                      {option.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };
