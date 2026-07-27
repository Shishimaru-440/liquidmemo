"use client";

import { useEffect, useRef, useState } from "react";
import type { FileMeta } from "@/lib/types";
import { SidebarItem } from "./SidebarItem";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  open: boolean;
  files: FileMeta[];
  currentFilename: string | null;
  onClose: () => void;
  onSelect: (filename: string) => void;
  onNewNote: () => void;
  onDelete: (filename: string) => void;
}

const SCROLL_CLOSE_THRESHOLD = 12;

function formatTime(mtimeMs: number): string {
  const date = new Date(mtimeMs);
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Sidebar({
  open,
  files,
  currentFilename,
  onClose,
  onSelect,
  onNewNote,
  onDelete,
}: SidebarProps) {
  const [revealedFilename, setRevealedFilename] = useState<string | null>(null);
  const lastScrollTopRef = useRef(0);

  // Closing the sidebar (scrim tap, opening a note, etc.) always closes any revealed row too.
  useEffect(() => {
    if (!open) setRevealedFilename(null);
  }, [open]);

  const handleListScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const top = e.currentTarget.scrollTop;
    if (Math.abs(top - lastScrollTopRef.current) > SCROLL_CLOSE_THRESHOLD) {
      setRevealedFilename(null);
    }
    lastScrollTopRef.current = top;
  };

  return (
    <>
      <div
        className={`${styles.scrim} ${open ? styles.scrimVisible : ""}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        <div className={styles.header}>
          <span className={styles.title}>Inbox</span>
          <button className={styles.newButton} onClick={onNewNote} type="button">
            + New
          </button>
        </div>
        <ul className={styles.list} onScroll={handleListScroll}>
          {files.map((file) => (
            <SidebarItem
              key={file.filename}
              title={file.title}
              time={formatTime(file.mtimeMs)}
              active={file.filename === currentFilename}
              revealed={file.filename === revealedFilename}
              onOpen={() => onSelect(file.filename)}
              onDelete={() => onDelete(file.filename)}
              onRevealChange={(revealed) => setRevealedFilename(revealed ? file.filename : null)}
            />
          ))}
          {files.length === 0 && <li className={styles.empty}>まだメモがないよ</li>}
        </ul>
      </aside>
    </>
  );
}
