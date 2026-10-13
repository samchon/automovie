/**
 * The shape-dependent joint points of a face basis: their ids, rest positions
 * and sparse endpoint rows (`IAutoMovieHumanFaceBasis.landmarks`).
 *
 * @evidence contracts/common.md#principled-implementation Ordered names, neutral metre positions and sparse shape rows keep joint centres with their identity edits; structural admission verifies names/populations/endpoint correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One row order addresses flat positions and sparse landmark indices while the basis assigns joint meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source joint points do not certify clinical anatomy; shaped centres are reread rather than fitted from stale neutral positions.
 * @evidence contracts/common.md#meaningful-documentation Members identify metre head-frame positions and sparse ordering; the parent distinguishes joint points from skin measurement landmarks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no landmark evaluation or sparse-row validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correspondence supplies inputs rather than a cached shaped-rest result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its arrays and target records; this type acquires no rig/task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisLandmarks {
  /** Landmark names, in row order. */
  ids: string[];

  /** Flat XYZ per landmark, in metres in the basis head frame. */
  positions: number[];

  /** Sparse rows per endpoint name, strictly increasing by landmark. */
  targets: Record<string, number[]>;
}
