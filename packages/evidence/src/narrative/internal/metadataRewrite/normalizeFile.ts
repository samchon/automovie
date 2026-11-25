import path from "node:path";

/** Rejects non-canonical paths capable of escaping either compared root. */
export function normalizeFile(file: string): string {
  const slashed: string = file.replaceAll("\\", "/");
  const normalized: string = path.posix.normalize(slashed);
  if (
    slashed === "" ||
    normalized !== slashed ||
    path.posix.isAbsolute(normalized) ||
    /^[A-Za-z]:/u.test(normalized) ||
    normalized
      .split("/")
      .some((part: string): boolean => part === ".." || part === ".") ||
    !normalized.endsWith(".md")
  )
    throw new Error(`${file}: expected a normalized relative Markdown path.`);
  return normalized;
}
