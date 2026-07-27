"use client";

import { useRef, useState } from "react";
import styles from "./Sidebar.module.css";

const DELETE_WIDTH = 76;
const REVEAL_THRESHOLD = DELETE_WIDTH / 2;
const DRAG_START_THRESHOLD = 8; // ignore tiny jitter so taps still register as taps

interface SidebarItemProps {
  title: string;
  time: string;
  active: boolean;
  /** Whether THIS row is the one currently revealed (single-open-at-a-time, like iOS). */
  revealed: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRevealChange: (revealed: boolean) => void;
}

export function SidebarItem({
  title,
  time,
  active,
  revealed,
  onOpen,
  onDelete,
  onRevealChange,
}: SidebarItemProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null); // non-null only while actively dragging
  const startXRef = useRef(0);
  const startRevealedRef = useRef(false);
  const draggedRef = useRef(false);

  const restingX = revealed ? -DELETE_WIDTH : 0;
  const clamp = (x: number) => Math.min(0, Math.max(-DELETE_WIDTH, x));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    startRevealedRef.current = revealed;
    draggedRef.current = false;
    setDragOffset(restingX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragOffset === null) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_START_THRESHOLD) draggedRef.current = true;
    setDragOffset(clamp((startRevealedRef.current ? -DELETE_WIDTH : 0) + delta));
  };

  const handlePointerUp = () => {
    if (dragOffset === null) return;
    onRevealChange(dragOffset < -REVEAL_THRESHOLD);
    setDragOffset(null);
  };

  const handleClick = () => {
    if (draggedRef.current) return; // this was a swipe, not a tap
    if (revealed) {
      onRevealChange(false); // tapping a revealed row closes it, like iOS
      return;
    }
    onOpen();
  };

  const x = dragOffset ?? restingX;

  return (
    <li className={styles.itemRow}>
      <button type="button" className={styles.deleteButton} onClick={onDelete}>
        削除
      </button>
      <button
        type="button"
        className={`${styles.item} ${active ? styles.itemActive : ""}`}
        style={{
          transform: `translateX(${x}px)`,
          transition: dragOffset === null ? "transform 0.25s var(--spring)" : "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        <span className={styles.itemTitle}>{title}</span>
        <span className={styles.itemTime}>{time}</span>
      </button>
    </li>
  );
}
