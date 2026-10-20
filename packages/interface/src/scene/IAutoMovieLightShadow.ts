/**
 * Explicit shadow-map resolution, bias and clip controls for supported punctual sources.
 *
 * @evidence contracts/common.md#principled-implementation Admitted positive map resolution and ordered positive camera clips configure the shared light-space shadow adapter, with finite depth and normal bias retained as authored numeric tuning.
 * @evidence contracts/common.md#clear-and-simple-design Five scalar controls describe common shadow state without exposing renderer camera objects or selecting the scene's master filter policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shadow tuning cannot enable unsupported area maps or override disabled scene shadows; near/far remain explicit rather than guessed from one fixture.
 * @evidence contracts/common.md#meaningful-documentation Defines resolution, depth and normal bias and positive ordered clip distances.
 */
export interface IAutoMovieLightShadow {
  /** Square shadow-map resolution, a positive safe integer. */
  mapSize: number;

  /** Depth bias used to suppress surface acne. */
  bias: number;

  /** Normal-relative depth bias. */
  normalBias: number;

  /** Positive shadow-camera near distance. */
  near: number;

  /** Shadow-camera far distance, greater than `near`. */
  far: number;
}
