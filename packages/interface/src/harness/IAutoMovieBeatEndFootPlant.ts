import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One stance plant carried across a beat boundary: where a foot stood on the
 * ground when the beat ended, as the ground-IK pass pinned it.
 *
 * Mirrors the engine's ground-IK plant output at the interface level so the
 * next beat can keep a planted foot exactly where the previous beat left it
 * instead of letting the first stride re-derive (and shift) the contact.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors one stance run of the ground-IK pass with inclusive bounds on the ended beat's clock, so `plantsAtEnd` keeps a plant exactly when `start <= cut <= end`.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, the foot bone, the run bounds and the pinned position, which is all the next beat needs to pin the same foot at the same world point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No foot is special-cased; when several runs of one foot contain the cut, `plantsAtEnd` keeps the latest start and gives equal starts to the later entry, a stated tie rule.
 * @evidence contracts/common.md#meaningful-documentation States the bone, that both bounds are inclusive seconds on the ended beat's local clock, and that `position` is a world point whose `y` lies on the ground.
 * @author Samchon
 */
export interface IAutoMovieBeatEndFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /** Inclusive stance-run start, seconds on the ended beat's local clock. */
  start: number;

  /** Inclusive stance-run end, seconds on the ended beat's local clock. */
  end: number;

  /** Pinned world foot position held across the run (`y` = ground plane). */
  position: IAutoMovieVector3;
}
