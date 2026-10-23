import path from "node:path";

/** Normalizes path spelling without consulting a mutable filesystem. */
export function canonicalProductionPath(filename: string): string {
  const portable: string = filename
    .replaceAll("\\", "/")
    .replace(/^\/\/[?.]\/UNC\//iu, "//")
    .replace(/^\/\/[?.]\//u, "");
  const windows: boolean = /^[A-Za-z]:\//u.test(portable);
  const paths: typeof path = windows ? path.win32 : path;
  const absolute: string = windows
    ? paths.normalize(portable)
    : paths.resolve(portable);
  const normalized: string = absolute
    .replaceAll("\\", "/")
    .replace(/\/+$/u, (suffix: string): string =>
      absolute.length === suffix.length || /^[A-Za-z]:[\\/]$/u.test(absolute)
        ? "/"
        : "",
    );
  return /^[A-Za-z]:\//u.test(normalized)
    ? normalized.toLowerCase()
    : normalized;
}
