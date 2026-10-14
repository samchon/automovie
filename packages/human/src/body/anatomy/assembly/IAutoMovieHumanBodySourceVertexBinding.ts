import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * Offline source weights over the anatomical graph, not humanoid bone aliases.
 *
 * Four entries per vertex identify source bone ordinals and nonnegative weights summing to one. Vertices are in the graph's common neutral metre frame; the renderer applies each posed times inverse rest transform. No editor accepts these arrays. A bone normally binds to itself; soft tissue requires actual authored attachment accounts and does not acquire physiological validity from linear blending.
 *
 * @evidence contracts/common.md#principled-implementation Four source-bone ordinals and nonnegative unit-sum weights per native vertex define linear blending in one common-neutral metre frame.
 * @evidence contracts/common.md#clear-and-simple-design The ordinal-to-anatomical-bone map and flat four-slot arrays share one binding account, keeping source bones distinct from humanoid aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-weight slots still require valid ordinals, and artist/source weighting alone confers no physiological validity on soft tissue.
 * @evidence contracts/common.md#meaningful-documentation The comment states four-slot layout, common frame, posed-times-inverse-rest meaning, ordinal uniqueness and annotation limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The binding interface defines a fixed-width layout without executing linear blend skinning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source weight rows are inputs rather than reusable completed posed-vertex results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly bone/weight arrays are publisher-owned and the type retains no skinning workspace.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceVertexBinding {
  /** The ordinal-to-anatomical-bone map; each bone occurs once. */
  bones: readonly AutoMovieHumanBodyBoneId[];

  /** Four bone ordinals per surface vertex; zero-weight slots still use valid ordinals. */
  boneIndices: readonly number[];

  /** Four finite nonnegative weights per vertex, summing to one. */
  weights: readonly number[];

  /** Original or authored weighting method, site references and limitations. */
  account: string;
}
