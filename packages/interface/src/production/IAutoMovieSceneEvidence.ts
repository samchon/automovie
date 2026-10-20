/**
 * One downstream citation of an authored screenplay scene.
 *
 * A reason explains the dependency on a stable screenplay scene. An optional continuity claim adds traceability; its declared verification owner still supplies the proof.
 *
 * @evidence contracts/common.md#principled-implementation Shot contracts, acceptance scenarios and continuity claims can carry this reason, scene id and optional claim id; the strings provide traceability without resolving existence or proof ownership.
 * @evidence contracts/common.md#clear-and-simple-design The short citation keeps reason and address together while canonical prose and claim verification remain with their authored owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A citation is traceability rather than proof that a continuity claim passed or a shot realized the scene; similar prose cannot substitute for the referenced stable identity.
 * @evidence contracts/common.md#meaningful-documentation Defines dependency reason, existing scene id and the optional claim's separate proof ownership.
 */
export interface IAutoMovieSceneEvidence {
  /** Why this downstream record depends on the cited scene. */
  reason: string;

  /** Existing screenplay scene id. */
  scene: string;

  /** Existing continuity claim id; omission means no canon claim is cited. */
  claim?: string;
}
