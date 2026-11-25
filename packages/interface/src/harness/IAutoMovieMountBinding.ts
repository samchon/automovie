import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A persistent coupling of one staged node to a bone of another, such as a
 * rider on a horse's `spine` or a passenger in a cart, declared once in staging
 * (`IAutoMovieStageActor.attach`) rather than re-attached in every shot.
 *
 * `stageScene` refuses self-riding and a parent that is not a placed actor.
 * `coupleObjects` refuses a missing parent rig or bone and coupling cycles,
 * orders parents before riders, and uses `compileAttach` to bake the full shot
 * at 30 Hz by default. At each key the rider's origin and rotation follow the
 * posed bone without a seat offset; interpolated keys approximate nonlinear
 * motion. Parent scale is omitted under staging's unit-scale actor premise, and
 * matching clinical axes/rest frames are required to agree with the displayed
 * skeleton. An explicit `attachTo` for the rider replaces its mount for the
 * shot. The binding carries into the next beat's staging and emits no grab or
 * release events.
 */
export interface IAutoMovieMountBinding {
  /**
   * Placed actor node that carries the rider; a rigged node, not the rider
   * itself.
   */
  parent: string;

  /**
   * Bone on the parent's skeleton the rider is fixed to, such as a horse's
   * `spine`.
   */
  bone: AutoMovieHumanoidBone;
}
