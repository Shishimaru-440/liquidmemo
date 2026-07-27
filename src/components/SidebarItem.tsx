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
  onOpen: () => void;
  onDelete: () => void;
}

export function SidebarItem({ title, time, active, onOpen, onDelete }: SidebarItemProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startDragXRef = useRef(0);
  const draggedRef = useRef(false);

  const clamp = (x: number) => Math.min(0, Math.max(-DELETE_WIDTH, x));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    startDragXRef.current = dragX;
    draggedRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_START_THRESHOLD) draggedRef.current = true;
    setDragX(clamp(startDragXRef.current + delta));
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    setDragX((current) => (current < -REVEAL_THRESHOLD ? -DELETE_WIDTH : 0));
  };

  const handleClick = () => {
    if (draggedRef.current) return; // this was a swipe, not a tap
    if (dragX !== 0) {
      setDragX(0); // tapping a revealed row closes it, like iOS
      return;
    }
    onOpen();
  };

  return (
    <li className={styles.itemRow}>
      <button type="button" className={styles.deleteButton} onClick={onDelete}>
        削除
      </button>
      <button
        type="button"
        className={`${styles.item} ${active ? styles.itemActive : ""}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.25s var(--spring)",
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
