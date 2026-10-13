import path from "node:path";

/**
 * Admit one project-relative source name with portable separators before lookup.
 */
export const normalizeSourcePath = (value: string): string => {
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized)
  )
    throw new Error(
      `${value}: instruction source path must stay inside the project root.`,
    );
  return normalized;
};
