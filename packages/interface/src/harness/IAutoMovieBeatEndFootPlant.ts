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
