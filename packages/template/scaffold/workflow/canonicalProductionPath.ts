import fs from "node:fs";
import path from "node:path";

/** Reconciles native path aliases without requiring a selected future file to exist. */
export function canonicalProductionPath(filename: string): string {
  const portable: string = filename.replaceAll("\\", "/");
  const windows: boolean = /^[A-Za-z]:\//u.test(portable);
  const paths: typeof path = windows ? path.win32 : path;
  const absolute: string = windows
    ? paths.normalize(portable)
    : paths.resolve(portable);
  let current: string = absolute;
  const remaining: string[] = [];
  let resolved: string = absolute;
  while (true) {
    try {
      resolved = paths.join(fs.realpathSync.native(current), ...remaining);
      break;
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !["ENOENT", "ENOTDIR"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      )
        throw error;
      const parent: string = paths.dirname(current);
      if (parent === current) break;
      remaining.unshift(paths.basename(current));
      current = parent;
    }
  }
  const normalized: string = resolved
    .replaceAll("\\", "/")
    .replace(/^\/\/[?.]\/UNC\//iu, "//")
    .replace(/^\/\/[?.]\//u, "");
  return /^[A-Za-z]:\//u.test(normalized)
    ? normalized.toLowerCase()
    : normalized;
}
