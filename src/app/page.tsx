"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NoteEditor } from "@/components/NoteEditor";
import { Sidebar } from "@/components/Sidebar";
import { PropertyMenu } from "@/components/PropertyMenu";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useInboxEvents } from "@/hooks/useInboxEvents";
import { useEdgeSwipeOpen } from "@/hooks/useEdgeSwipeOpen";
import type { FileMeta } from "@/lib/types";
import styles from "./page.module.css";

const SAVE_DEBOUNCE_MS = 800;

async function fetchFileList(): Promise<FileMeta[]> {
  const res = await fetch("/api/files");
  const data = await res.json();
  return data.files as FileMeta[];
}

export default function Home() {
  const [filename, setFilename] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [properties, setProperties] = useState<Record<string, unknown>>({});
  const [resetKey, setResetKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [externalConflict, setExternalConflict] = useState(false);
  const [deletedElsewhere, setDeletedElsewhere] = useState(false);

  // Refs mirror latest state for use inside stable callbacks (debounce handler, SSE handler).
  const filenameRef = useRef(filename);
  filenameRef.current = filename;
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const lastSavedBodyRef = useRef("");
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;

  const refreshFilesNow = useCallback(() => {
    fetchFileList().then(setFiles).catch(() => {});
  }, []);
  // SSE can fire many events in a burst (e.g. a phone dumping a batch of synced
  // notes); coalesce them into a single re-scan instead of one full readdir+stat per event.
  const refreshFiles = useDebouncedCallback(refreshFilesNow, 300);

  useEffect(() => {
    refreshFilesNow();
  }, [refreshFilesNow]);

  const persist = useDebouncedCallback(async (nextBody: string) => {
    const trimmed = nextBody.trim();
    const currentFilename = filenameRef.current;

    if (!trimmed) {
      if (currentFilename) {
        await fetch(`/api/files/${encodeURIComponent(currentFilename)}`, { method: "DELETE" });
        setFilename(null);
        lastSavedBodyRef.current = "";
        refreshFiles();
      }
      return;
    }

    if (!currentFilename) {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: nextBody }),
      });
      const data = await res.json();
      setFilename(data.filename);
      setProperties(data.properties);
      lastSavedBodyRef.current = nextBody;
      refreshFiles();
      return;
    }

    const res = await fetch(`/api/files/${encodeURIComponent(currentFilename)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: nextBody, properties: propertiesRef.current }),
    });
    const data = await res.json();
    if (data.filename !== currentFilename) setFilename(data.filename);
    lastSavedBodyRef.current = nextBody;
    refreshFiles();
  }, SAVE_DEBOUNCE_MS);

  const handleEditorChange = useCallback(
    (markdown: string) => {
      setBody(markdown);
      persist(markdown);
    },
    [persist]
  );

  const startNewNote = useCallback(() => {
    setFilename(null);
    setBody("");
    setProperties({});
    lastSavedBodyRef.current = "";
    setExternalConflict(false);
    setDeletedElsewhere(false);
    setResetKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const openNote = useCallback(async (targetFilename: string) => {
    const res = await fetch(`/api/files/${encodeURIComponent(targetFilename)}`);
    if (!res.ok) return;
    const data = await res.json();
    setFilename(data.filename);
    setBody(data.body);
    setProperties(data.properties);
    lastSavedBodyRef.current = data.body;
    setExternalConflict(false);
    setDeletedElsewhere(false);
    setResetKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const reloadFromDisk = useCallback(() => {
    if (filenameRef.current) openNote(filenameRef.current);
  }, [openNote]);

  const deleteNote = useCallback(
    async (targetFilename: string) => {
      await fetch(`/api/files/${encodeURIComponent(targetFilename)}`, { method: "DELETE" });
      if (targetFilename === filenameRef.current) {
        startNewNote();
      }
      refreshFilesNow();
    },
    [startNewNote, refreshFilesNow]
  );

  useInboxEvents((event) => {
    refreshFiles();
    if (event.filename !== filenameRef.current) return;

    if (event.type === "unlink") {
      setDeletedElsewhere(true);
      return;
    }

    if (event.type === "change" || event.type === "add") {
      if (bodyRef.current === lastSavedBodyRef.current) {
        // No local unsaved edits — safe to pull in the external change automatically.
        reloadFromDisk();
      } else {
        setExternalConflict(true);
      }
    }
  });

  const handleAddProperty = useCallback(
    (key: string, value: string) => {
      const next = { ...propertiesRef.current, [key]: value };
      setProperties(next);
      if (filenameRef.current) {
        persist(bodyRef.current);
      }
    },
    [persist]
  );

  const edgeSwipeHandlers = useEdgeSwipeOpen(() => setSidebarOpen(true), !sidebarOpen);

  return (
    <div className={styles.page} {...edgeSwipeHandlers}>
      <Sidebar
        open={sidebarOpen}
        files={files}
        currentFilename={filename}
        onClose={() => setSidebarOpen(false)}
        onSelect={openNote}
        onNewNote={startNewNote}
        onDelete={deleteNote}
      />

      <header className={styles.header}>
        <button
          type="button"
          className={styles.hamburger}
          aria-label="メニューを開く"
          onClick={() => setSidebarOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <PropertyMenu properties={properties} onAdd={handleAddProperty} />
      </header>

      {deletedElsewhere && (
        <div className={styles.banner}>
          このメモは他の端末で削除されたよ。
          <button type="button" onClick={startNewNote}>
            新規メモへ
          </button>
        </div>
      )}
      {externalConflict && !deletedElsewhere && (
        <div className={styles.banner}>
          外部で更新されてるよ、今の編集内容は保持中。
          <button
            type="button"
            onClick={() => {
              setExternalConflict(false);
              reloadFromDisk();
            }}
          >
            最新を読み込む
          </button>
        </div>
      )}

      <main className={styles.editorArea}>
        <NoteEditor initialBody={body} resetKey={resetKey} onChange={handleEditorChange} />
      </main>
    </div>
  );
}
