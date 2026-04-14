"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DropdownOption<T extends string | number = string | number> {
  label: string;
  value: T;
}

interface CustomDropdownProps<T extends string | number = string | number> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

interface MenuRect {
  left: number;
  top: number;
  width: number;
  openUpward: boolean;
}

const MENU_MAX_HEIGHT = 256;
const MENU_GAP = 8;

export default function CustomDropdown<T extends string | number = string | number>({
  options,
  value,
  onChange,
  placeholder = "Select…",
  ariaLabel,
  className = "",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateRect = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUpward = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow;
    setRect({
      left: r.left,
      top: openUpward ? r.top : r.bottom,
      width: r.width,
      openUpward,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateRect();
  }, [isOpen, updateRect]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handleReflow = () => updateRect();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleReflow, true);
    window.addEventListener("resize", handleReflow);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleReflow, true);
      window.removeEventListener("resize", handleReflow);
    };
  }, [isOpen, updateRect]);

  const selected = options.find((opt) => opt.value === value);

  const menu =
    mounted && isOpen && rect
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: rect.left,
              top: rect.openUpward ? undefined : rect.top + MENU_GAP,
              bottom: rect.openUpward
                ? window.innerHeight - rect.top + MENU_GAP
                : undefined,
              width: rect.width,
              maxHeight: MENU_MAX_HEIGHT,
              zIndex: 1000,
            }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            <ul className="flex max-h-full flex-col gap-0.5 overflow-y-auto">
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <li key={String(opt.value)}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                        isActive
                          ? "bg-white/[0.08] text-zinc-50"
                          : "text-zinc-300"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isActive && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-zinc-100"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="flex w-full items-center justify-between gap-3 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium tracking-wide text-zinc-100 shadow-sm shadow-black/20 backdrop-blur-md outline-none transition hover:border-white/30 hover:bg-white/[0.09] focus:border-white/40"
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {menu}
    </div>
  );
}
