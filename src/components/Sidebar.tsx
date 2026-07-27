"use client";

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
        <ul className={styles.list}>
          {files.map((file) => (
            <SidebarItem
              key={file.filename}
              title={file.title}
              time={formatTime(file.mtimeMs)}
              active={file.filename === currentFilename}
              onOpen={() => onSelect(file.filename)}
              onDelete={() => onDelete(file.filename)}
            />
          ))}
          {files.length === 0 && <li className={styles.empty}>まだメモがないよ</li>}
        </ul>
      </aside>
    </>
  );
}
