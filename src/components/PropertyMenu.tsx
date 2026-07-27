"use client";

import { useState } from "react";
import styles from "./PropertyMenu.module.css";

interface PropertyMenuProps {
  properties: Record<string, unknown>;
  onAdd: (key: string, value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Small popover for adding custom frontmatter properties (tags, status, etc.) to the current note. */
export function PropertyMenu({ properties, onAdd, open, onOpenChange }: PropertyMenuProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const customEntries = Object.entries(properties).filter(([k]) => k !== "source");

  const handleAdd = () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    onAdd(trimmedKey, value.trim());
    setKey("");
    setValue("");
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => onOpenChange(!open)}
        aria-label="プロパティを追加"
      >
        +Property
      </button>
      {open && (
        <div className={styles.popover}>
          {customEntries.length > 0 && (
            <ul className={styles.existing}>
              {customEntries.map(([k, v]) => (
                <li key={k}>
                  <span className={styles.propKey}>{k}</span>
                  <span className={styles.propValue}>{String(v)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.form}>
            <input
              className={styles.input}
              placeholder="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <input
              className={styles.input}
              placeholder="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <button type="button" className={styles.addButton} onClick={handleAdd}>
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
