"use client";

import type { FileMeta } from "@/lib/types";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  open: boolean;
  files: FileMeta[];
  currentFilename: string | null;
  onClose: () => void;
  onSelect: (filename: string) => void;
  onNewNote: () => void;
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
            <li key={file.filename}>
              <button
                type="button"
                className={`${styles.item} ${
                  file.filename === currentFilename ? styles.itemActive : ""
                }`}
                onClick={() => onSelect(file.filename)}
              >
                <span className={styles.itemTitle}>{file.title}</span>
                <span className={styles.itemTime}>{formatTime(file.mtimeMs)}</span>
              </button>
            </li>
          ))}
          {files.length === 0 && <li className={styles.empty}>まだメモがないよ</li>}
        </ul>
      </aside>
    </>
  );
}
