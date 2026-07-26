import { EventEmitter } from "node:events";
import chokidar, { FSWatcher } from "chokidar";
import { INBOX_DIR } from "./config";

export type FileEventType = "add" | "change" | "unlink";

export interface FileEvent {
  type: FileEventType;
  filename: string;
}

interface WatcherState {
  emitter: EventEmitter;
  watcher: FSWatcher;
  selfTouches: Set<string>;
}

const SELF_TOUCH_EXPIRY_MS = 2000;

// Survives Next.js dev-mode module reloads so we never attach a second chokidar watcher.
const globalForWatcher = globalThis as unknown as { __liquidmemoWatcher?: WatcherState };

function createWatcher(): WatcherState {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);
  const selfTouches = new Set<string>();

  const watcher = chokidar.watch(INBOX_DIR, {
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  const handle = (type: FileEventType) => (filePath: string) => {
    const filename = filePath.split("/").pop() ?? filePath;
    if (!filename.endsWith(".md")) return;
    if (selfTouches.has(filename)) return; // our own write/delete, don't echo as "external"
    emitter.emit("event", { type, filename } satisfies FileEvent);
  };

  watcher.on("add", handle("add"));
  watcher.on("change", handle("change"));
  watcher.on("unlink", handle("unlink"));

  return { emitter, watcher, selfTouches };
}

function getState(): WatcherState {
  if (!globalForWatcher.__liquidmemoWatcher) {
    globalForWatcher.__liquidmemoWatcher = createWatcher();
  }
  return globalForWatcher.__liquidmemoWatcher;
}

/** Call right after the app itself writes/renames/deletes a file, so the watcher doesn't echo it back as an external change. */
export function markSelfTouch(filename: string): void {
  const { selfTouches } = getState();
  selfTouches.add(filename);
  setTimeout(() => selfTouches.delete(filename), SELF_TOUCH_EXPIRY_MS);
}

export function subscribe(listener: (event: FileEvent) => void): () => void {
  const { emitter } = getState();
  emitter.on("event", listener);
  return () => emitter.off("event", listener);
}
