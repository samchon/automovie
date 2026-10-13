import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";

import { fail } from "./referenceError";

const layers: ReadonlySet<string> = new Set(AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS);
const reserved = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu;

/** Admit an exact authored Markdown identity before any source read. */
export function admitReferencePath(file: string): void {
  const parts = file.split("/");
  if (
    parts.length < 3 ||
    parts[0] !== "docs" ||
    !layers.has(parts[1]) ||
    !file.endsWith(".md") ||
    parts.some((part) => !validComponent(part))
  )
    fail(
      "INVALID_PATH",
      "Use an exact project-relative docs/<authored-layer>/<file>.md path.",
    );
}

/**
 * Decide portable filename admission without consulting or normalizing the source.
 */
export function validComponent(part: string): boolean {
  return (
    part.length > 0 &&
    part !== "." &&
    part !== ".." &&
    !/[\\/:"#?*<>|\u0000-\u001f\u007f]/u.test(part) &&
    !/[. ]$/u.test(part) &&
    !reserved.test(part) &&
    !part.startsWith(".")
  );
}

/**
 * Split one exact section address without guessing an anchor or normalizing a path.
 */
export function splitReferenceLocation(location: string): {
  /** Admitted canonical authored Markdown path before the single anchor separator. */
  file: string;
  /** Exact nonempty authored anchor after the separator, without slug inference. */
  anchor: string;
} {
  const index = location.indexOf("#");
  if (
    index < 1 ||
    index === location.length - 1 ||
    location.indexOf("#", index + 1) !== -1
  )
    return fail(
      "INVALID_LOCATION",
      "Use the exact file#anchor returned by the file index.",
    );
  const file = location.slice(0, index);
  admitReferencePath(file);
  return { file, anchor: location.slice(index + 1) };
}
