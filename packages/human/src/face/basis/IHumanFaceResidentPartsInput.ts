import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";

/**
 * The current face construction's native-region gather inputs.
 * Actual generated ownership selects retained incidence; appearance changes
 * neither that incidence nor the pose arrays supplied by its owner.
 *
 * @evidence contracts/common.md#principled-implementation Same-state pose and actual generated brow/lash replacement populations select native retained incidence; fibre and named skin reflectance address those same source vertices.
 * @evidence contracts/common.md#clear-and-simple-design Geometry replacement, appearance fields and source gain populations have separate members, keeping finish edits independent of source correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deliberate empty lash populations still own their replacement meaning; actual enrolled incidence rather than guessed painted coordinates selects removed source parts.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish current numerical document, immutable pose, exact replacement populations and independently produced source gains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input gathers nothing; resident region and colour owners carry traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the gatherer reuses unchanged region tables and exact pose arrays.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; borrowed maps/sets remain build-owned during gathering.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentPartsInput {
  /** Resolved current numerical document, including its appearance fields. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Exact pose whose coordinates, normals and optical replacement population are emitted. */
  pose: IHumanFacePoseResult;

  /** Actual source-card vertices replaced by the generated brow assembly. */
  browReplacements: ReadonlyMap<string, ReadonlySet<number>>;

  /** Actual lash regions replaced by requested shaft rows, including zero populations. */
  replacedLashes: ReadonlySet<string>;

  /** Source-vertex reflectance gains supplied by the fibre population owners. */
  fibreTints: ReadonlyMap<string, readonly number[]>;

  /** Independent named skin reflectance gains on the same source vertices. */
  skinGains: ReadonlyMap<string, readonly number[]>;
}
