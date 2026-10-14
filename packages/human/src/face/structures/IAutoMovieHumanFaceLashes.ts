import type { IAutoMovieHumanFaceLowerLashPair } from "./IAutoMovieHumanFaceLowerLashPair";
import type { IAutoMovieHumanFaceUpperLashPair } from "./IAutoMovieHumanFaceUpperLashPair";

/**
 * A document's independent lash profiles, upper and lower rows separately.
 *
 * A present row replaces that row's lash cards with numerical lashes rooted on
 * the registered live anterior lid edge, distinct from the posterior contact
 * margin. Count is explicit for each side, including zero. It needs the
 * basis's periocular and anterior root registrations; without them the builder
 * refuses the document by name. An omitted row keeps its source-card geometry;
 * separate material overrides still belong to the material owner.
 *
 * @evidence contracts/common.md#principled-implementation Explicit independent upper/lower populations replace registered anterior-root lash owners while leaving omitted rows on their original source-card path.
 * @evidence contracts/common.md#clear-and-simple-design Optional row pairs delegate geometry and counts to their canonical per-eye population profiles, separate from posterior lid contact margins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing periocular/root registration refuses a supplied row, and zero counts do not admit invalid hidden profiles; no source-card area is treated as a follicle count.
 * @evidence contracts/common.md#meaningful-documentation Present versus omitted rows, anatomical root margin and independent explicit counts explain source preservation and replacement without claiming clinical sampling.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This row selector performs no root sampling or shaft construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source-row preservation is consumer behavior, not cached work in this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Profile data creates no lash meshes, contact queries or renderer resources here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLashes {
  /** Upper lash row, or omitted to keep the basis's upper cards. */
  upper?: IAutoMovieHumanFaceUpperLashPair;

  /** Lower lash row, or omitted to keep the basis's lower cards. */
  lower?: IAutoMovieHumanFaceLowerLashPair;
}
