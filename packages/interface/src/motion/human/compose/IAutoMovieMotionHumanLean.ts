import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Trunk lean primitives: the whole body above the feet tipped about the hips,
 * with the hips moved back so the centre of mass stays over the feet.
 *
 * A standing person who tips the trunk forward moves the hips back by the same
 * movement, or falls forward (the counter-movement of a bow, a reach to the
 * floor, a look under a table). The planted legs keep their goals and are
 * solved again when the posture is resolved.
 */
export namespace IAutoMovieMotionHumanLean {
  /** A lean over a window. */
  export interface IBow {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IAutoMovieMotionHumanPosture;

    /** The deepest forward pitch, degrees; positive. */
    peak: number;

    /**
     * The physical terms asked (`IAutoMovieMotionHumanBalance`): absent, the
     * hips are not shifted back and no centre of mass is read.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * How much of the peak pitch the trunk holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /** A tilt of the whole body about the root, degrees added to the posture. */
  export interface IAngles {
    /** Forward pitch added, degrees. */
    pitch: number;

    /** Roll added, degrees. */
    roll: number;
  }

  /** A tilt over a window. */
  export interface ITilt {
    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * The tilt added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     */
    angles(seconds: number): IAutoMovieMotionHumanLean.IAngles;
  }

  /** A sway over a window. */
  export interface ISway {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * Seconds since the action's start from which the root and the trunk are
     * written.
     */
    from: number;

    /**
     * Seconds since the action's start until which the root and the trunk are
     * written.
     */
    to: number;

    /**
     * The tilt about the hips added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     */
    angles(seconds: number): IAutoMovieMotionHumanLean.IAngles;

    /**
     * The hips' travel over the floor from where the posture holds them; none
     * when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns Metres in the performer's floor frame: `x` left, `z` forward;
     *   `y` is not read.
     */
    shift?(seconds: number): IAutoMovieVector3;

    /**
     * The leg goals the hips' height is solved against; the posture's own leg
     * goals when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns The two leg goals at that second.
     */
    legs?(
      seconds: number,
    ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg">;
  }
}
