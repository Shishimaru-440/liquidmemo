export interface FileMeta {
  filename: string;
  title: string;
  mtimeMs: number;
}

export interface FileContent {
  filename: string;
  body: string;
  properties: Record<string, unknown>;
}

export interface InboxEvent {
  type: "add" | "change" | "unlink";
  filename: string;
}
