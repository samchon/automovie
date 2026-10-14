import path from "node:path";
import { normalizeAutoMovieProductionProjectSlash } from "./normalizeAutoMovieProductionProjectSlash";

/**
 * Attribute one native host path relative to the project root in diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Composes native path.relative with native-separator formatting, preserving actual component and case spelling rather than inventing a logical record address.
 * @evidence contracts/common.md#clear-and-simple-design Project read/layout/publication diagnostics use one presentation operation while containment and physical-root checks remain at their owning operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A foreign path can retain parent segments in its diagnostic address; this formatting helper neither admits it nor disguises it as an owned file.
 * @evidence contracts/common.md#meaningful-documentation States diagnostic-relative spelling and separate ownership admission; equal root and file produces the native empty relative path.
 * @evidence contracts/performance.md#efficient-algorithms Native relative calculation and slash formatting scale with path text and allocate only local/result strings, independent of filesystem size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This presentation has no substantial repeated phase work; caching would retain every error-path spelling without removing physical validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The diagnostic composer owns the returned string; no file handle, task or resident path map is acquired.
 */
export function relativeAutoMovieProductionProjectPath(root: string, file: string): string { return normalizeAutoMovieProductionProjectSlash(path.relative(root, file)); }
