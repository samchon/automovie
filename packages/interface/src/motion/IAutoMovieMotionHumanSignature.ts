import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";

/**
 * The kinematic readings of an act's signature: what human-movement studies
 * measure on a performer, read off the displayed bones of a performance.
 *
 * A production checks its own composition with these the way the vocabulary is
 * checked: perform it, then read, at the instants the act's events name, the
 * quantities the literature reports (the trunk's inclination from vertical in
 * the sagittal plane, joint flexions, the whole-body centre of mass, the head's
 * pitch, which feet bear on the floor, the duty factor and the cadence), and
 * compare each with a cited value in a unit test. No reading knows an action;
 * the bounds and their sources belong to the test.
 *
 * ```ts
 * const reader = AutoMovieMotionHumanSignature.read(
 *   performance,
 *   "a",
 *   body,
 *   0,
 * );
 * const lean =
 *   AutoMovieMotionHumanSignature.trunk(reader, seconds) -
 *   AutoMovieMotionHumanSignature.trunk(reader, 0);
 * ```
 *
 * Conventions: the performer's forward is the heading given to the reader, so a
 * positive inclination tips the shoulders ahead of the hips; a flexion is 0
 * with the joint straight and grows as it folds; a head pitch is positive when
 * the face turns down. A foot bears on the floor when its lowest sole socket
 * (heel, ball or toe) lies within `CONTACT` of the floor's height and is nearly
 * still over it (`SLIDE`). The trunk reading of a quiet stance is not exactly
 * zero on every body, so a lean is read against the same body's standing
 * value.
 */
export namespace IAutoMovieMotionHumanSignature {
  /**
   * What the readings need of a performance: its length and anyone's displayed
   * bones.
   */
  export interface IMotion {
    /** Seconds from 0 to the end. */
    duration: number;

    /**
     * A person's displayed world bones at a film second.
     *
     * @param subject The person.
     * @param seconds Film seconds.
     * @returns Resolved bones by rig bone.
     */
    bones(
      subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /** One performer of a motion, as the readings take them. */
  export interface IReader {
    /** The motion. */
    motion: IAutoMovieMotionHumanSignature.IMotion;

    /** The performer. */
    subject: string;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;

    /** The heading their forward is read along, degrees about +Y, 0 facing +Z. */
    yaw: number;
  }

  /** The gait of a window: the duty factor of each foot and the cadence. */
  export interface IGait {
    /** The share of the window each foot bears, averaged over both feet. */
    duty: number;

    /** Foot strikes (a foot coming down) per minute, both feet. */
    cadence: number;

    /** The strikes, in time order, with the foot. */
    strikes: {
      /** Observed heel-strike instant in the gait sample's seconds. */
      seconds: number;
      /** Foot whose heel made the observed strike. */
      side: "left" | "right";
    }[];
  }
}
