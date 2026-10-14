import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphReference } from "@ttsc/evidence";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import { projectAutoMovieNativeReferences } from "./projectAutoMovieNativeReferences";


/**
 * Binds whole narrative and delivery documents to their inherited parents.
 *
 * Technical design relationships belong to their consuming H2 units. A second file host would duplicate the same foundation coverage without another owner.
 *
 *
 * @evidence contracts/common.md#principled-implementation Narrative and brief file hosts carry supplied inherited-parent references only when the reference inventory is nonempty.
 * @evidence contracts/common.md#clear-and-simple-design File parentage stays distinct from technical design H2 coverage, avoiding a duplicate owner for the same foundation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported layer file claims and empty references return an empty population rather than inventing a placeholder claim.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies file-versus-H2 ownership; enabled controls only claim activation and native projection preserves structural references.
 * @evidence contracts/performance.md#efficient-algorithms Fixed layer admission plus projection of R references with K total enumerable own fields costs O(R+K) field operations and added slots; nested selectors are shared and no matching population is enumerated here.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied population selectors are reused and scalar native projection defines the shared companion policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned graph claim owns its projected records while supplied selector arrays stay caller-owned; no file resource is opened.
 */
export function createAutoMovieAuthoredFileClaims(
  layer: AutoMovieAuthoredDocumentLayer,
  populationFiles: string[],
  references: ITtscEvidenceGraphReference[],
  enabled: boolean,
): ITtscEvidenceGraphClaim[] {
  if (
    !["treatments", "scripts", "screenplays", "briefs"].includes(layer) ||
    references.length === 0
  )
    return [];
  return [
    {
      name: `${layer} files account for inherited settings, designs, and parent files`,
      type: "markdown",
      root: "docs",
      files: populationFiles,
      symbol: "file",
      disabled: !enabled,
      reference: projectAutoMovieNativeReferences(references),
    },
  ];
}
