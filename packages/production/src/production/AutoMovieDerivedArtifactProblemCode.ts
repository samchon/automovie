

/**
 * Closed inspection codes separate missing/stale basis or output, manifest problems, namespace collision and unsafe paths.
 *
 * @evidence contracts/common.md#principled-implementation Closed inspection codes separate missing/stale basis or output, manifest problems, namespace collision and unsafe paths.
 * @evidence contracts/common.md#clear-and-simple-design Inspection forwards these categories to compile/currentness diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A code is an observation classification, not permission to repair bytes or ignore an entry.
 * @evidence contracts/common.md#meaningful-documentation Documents missing, stale, malformed and unsafe distinctions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased inspection-category union scans no ledger; inspectAutoMovieDerivedArtifacts owns manifest and byte validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Categories coordinate no cache; each inspection observes its current declared closure.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union retains no file or message; the inspection caller owns emitted problem records and any returned closure buffers.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactProblemCode = "derived-artifact-basis-missing" | "derived-artifact-basis-stale" | "derived-artifact-external-collision" | "derived-artifact-manifest-malformed" | "derived-artifact-manifest-missing" | "derived-artifact-output-malformed" | "derived-artifact-output-missing" | "derived-artifact-output-stale" | "derived-artifact-path-unsafe";
