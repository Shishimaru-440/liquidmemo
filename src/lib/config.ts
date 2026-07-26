import path from "node:path";

export const INBOX_DIR =
  process.env.INBOX_DIR_PATH || path.join(process.cwd(), ".inbox-dev");
