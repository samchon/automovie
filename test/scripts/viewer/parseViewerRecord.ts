import type { IViewerRecord } from "./IViewerIo";

/**
 * Read the record of a server this tool started, or `null` for text that is
 * not one: absent, malformed JSON, or a shape without a positive integer
 * process id and a text time. A corrupt record must never become a process id
 * to kill, so anything short of a complete record is refused.
 *
 * @param text The record file's text, or `null` when it does not exist.
 */
export function parseViewerRecord(text: string | null): IViewerRecord | null {
  if (text === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { pid, startedAt } = value as Record<string, unknown>;
  return typeof pid === "number" &&
    Number.isInteger(pid) &&
    pid > 0 &&
    typeof startedAt === "string"
    ? { pid, startedAt }
    : null;
}
