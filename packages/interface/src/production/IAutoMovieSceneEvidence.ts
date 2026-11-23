/**
 * One downstream citation of an authored screenplay scene.
 *
 * A reason explains the dependency on a stable screenplay scene. An optional
 * continuity claim adds traceability; its declared verification owner still
 * supplies the proof.
 */
export interface IAutoMovieSceneEvidence {
  /** Why this downstream record depends on the cited scene. */
  reason: string;

  /** Existing screenplay scene id. */
  scene: string;

  /** Existing continuity claim id; omission means no canon claim is cited. */
  claim?: string;
}
