import { TextDecoder } from "node:util";

/** Decodes strict UTF-8 while preserving a leading byte order mark. */
export const UTF8: TextDecoder = new TextDecoder("utf-8", {
  fatal: true,
  ignoreBOM: true,
});
