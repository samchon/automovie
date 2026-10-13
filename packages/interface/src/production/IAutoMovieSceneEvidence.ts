/**
 * One downstream citation of an authored screenplay scene.
 *
 * The reason comes first because traceability starts with why the consumer
 * needs evidence; {@link scene} then names the stable locked production fact. A
 * continuity claim may be cited as additional traceability, but only its
 * declared verification owner can prove it.
 */
export interface IAutoMovieSceneEvidence {
  /** Why this downstream record depends on the cited scene. */
  reason: string;

  /** Existing screenplay scene id. */
  scene: string;

  /** Existing continuity claim id, or null when no canon claim is cited. */
  claim?: string;
}
