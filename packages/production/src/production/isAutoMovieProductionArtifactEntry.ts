/**
 * Whether one entry directly inside a production output root is state some
 * production owns rather than the supported root-document exception.
 *
 * A regular `renders/README.md` is classified as project documentation. The
 * current blank scaffold does not create that file; this preserves the existing
 * storage classification for projects that have it. No production namespace
 * claims that regular file. Every other entry is output a production owns, including a
 * directory or a link that borrows that name, because a name alone is not what
 * makes an entry documentation.
 *
 * One rule answers both questions asked of this judgment: whether a first
 * initialization would strand a namespace that already owns output, and whether
 * a legacy layout migration may carry an entry into the production namespace. A
 * second copy would let those two answers disagree, which is how a migration
 * came to move the one document the namespace resolver had already ruled out.
 *
 * @evidence contracts/common.md#principled-implementation The supported regular renders/README.md exception remains project documentation even though the current scaffold does not create it; every other direct entry, including a directory/link with that spelling, remains production-owned output requiring namespace admission.
 * @evidence contracts/common.md#clear-and-simple-design Initialization and legacy namespace migration share this one classification so a documentation exception cannot diverge between those storage operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supported documentation path exception requires both renders-root location and regular-file kind; a borrowed name alone cannot hide output or a link from ownership checks.
 * @evidence contracts/common.md#meaningful-documentation States direct-entry scope, tracked documentation exception and directory/link behavior.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar comparisons classify one entry without reading bytes or scanning a directory; the directory walker owns population cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate coordinates no requests and derives a result directly from the current caller-supplied entry facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call returns one boolean and retains no path, directory handle or task; the walker owns observation lifetime.
 */
export function isAutoMovieProductionArtifactEntry(props: {
  /** Output root the entry sits directly inside. */
  directory: "productions" | "generated" | "renders";
  /** Entry name exactly as the directory reports it. */
  name: string;
  /** Whether the entry is a regular file. */
  isFile: boolean;
}): boolean {
  return props.directory !== "renders" ||
  props.name !== "README.md" ||
  props.isFile === false;
}
