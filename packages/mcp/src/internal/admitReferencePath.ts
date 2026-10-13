import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";
import { fail } from "./fail";
import { validComponent } from "./validComponent";


const layers: ReadonlySet<string> = new Set(AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS);


/** Admit an exact authored Markdown identity before any source read.
 *
 * @evidence contracts/common.md#principled-implementation Raw slash-delimited paths must begin with docs and a supported authored layer, end with .md and pass portable component admission before source access.
 * @evidence contracts/common.md#clear-and-simple-design This function owns whole-path identity while validComponent owns individual filename constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths are checked without normalization, fallback or inferred namespace; traversal, stream aliases and hidden components refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment states pre-read admission; INVALID_PATH explains the required exact project-relative form.
 * @evidence contracts/performance.md#efficient-algorithms Splitting and scanning a path of L characters takes O(L) time and component storage; no filesystem observation occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The module shares one immutable layer membership set; each raw path is validated independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary path components are retained during admission; no source content or descriptor is acquired.
 */
export function admitReferencePath(file: string): void {
  const parts: string[] = file.split("/");
  if (
    parts.length < 3 ||
    parts[0] !== "docs" ||
    !layers.has(parts[1]) ||
    !file.endsWith(".md") ||
    parts.some((part: string) : boolean => !validComponent(part))
  )
    fail(
      "INVALID_PATH",
      "Use an exact project-relative docs/<authored-layer>/<file>.md path.",
    );
}
