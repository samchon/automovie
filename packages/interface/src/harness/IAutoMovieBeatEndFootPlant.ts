import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One stance plant carried across a beat boundary: where a foot stood when the
 * beat ended, as the ground-IK pass pinned it.
 *
 * `performShot` produces these through `plantStanceFeet` for an actor whose
 * motion carries a gait cycle or resumed plants and whose rig has recognized
 * feet, converting each position to world space. The next beat passes the
 * plants held at the cut back as opening plants, so a planted foot stays
 * exactly where the previous beat left it instead of the first stride
 * re-deriving and shifting the contact.
 *
 * @evidence contracts/common.md#principled-implementation `plantStanceFeet` pins a foot for an inclusive stance run, `performShot` maps the pinned model-space point through the actor's staged placement into world space, and the next beat maps it back into its own model space before planting.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, foot, run bounds and pinned point, are what the next beat's planting needs; the engine's internal plant output is mirrored here so the beat-end record stays in `interface` without importing engine types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The position is the point the pass pinned, carried verbatim, so the next beat keeps the contact instead of re-solving it from the first stride and sliding the foot.
 * @evidence contracts/common.md#meaningful-documentation States the producer and when it produces plants, the world-space conversion, how the next beat consumes them and why; members give the clock, inclusivity, unit and frame of each field.
 * @author Samchon
 */
export interface IAutoMovieBeatEndFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /** Inclusive stance-run start, seconds on the ended beat's local clock. */
  start: number;

  /** Inclusive stance-run end, seconds on the ended beat's local clock. */
  end: number;

  /**
   * Pinned world foot position in meters held across the run, its `y` on the
   * ground the pass planted it on.
   */
  position: IAutoMovieVector3;
}
