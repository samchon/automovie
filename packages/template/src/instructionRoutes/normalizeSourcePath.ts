import path from "node:path";

/**
 * Admit one project-relative source name with portable separators before lookup.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Admits one project-relative source name with portable separators and refuses root escapes before publication lookup.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Admits one project-relative source name with portable separators and refuses root escapes before publication lookup.
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
