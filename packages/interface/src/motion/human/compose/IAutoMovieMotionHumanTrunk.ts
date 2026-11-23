import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";

/**
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its knees,
 * and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by {@link HumanBalance.shift} on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no shift
 * is stated as a constant.
 */
export namespace IAutoMovieMotionHumanTrunk {
  /** A crouch over two windows. */
  export interface ICrouch extends IShape {
    /** The action's clock. */
    clock: IAutoMovieMotionClock;

    /** The instants the body starts sinking and is lowest at. */
    rise: readonly [string, string];

    /** The instants the body starts rising and stands again at. */
    fall: readonly [string, string];
  }

  /**
   * Fixed stance, planted limbs and geometric demand shared by repetitions of
   * one crouch.
   */
  export interface IShape {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The physical terms asked (`IAutoMovieMotionHumanBalance`): absent, the
     * hips sink where they stand and no centre of mass is read; with `balance`
     * they move back so the centre of mass stays over the feet.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IAutoMovieMotionHumanPosture;

    /** How far the hips sink at the lowest, metres; not negative. */
    depth: number;

    /**
     * The trunk's forward inclination at the lowest, degrees, shared between
     * the pelvis and the spine by `sunk`; not negative.
     */
    pitch: number;

    /**
     * The legs the crouch plants where `standing` puts their feet; both when
     * absent. A leg left out is the caller's to place.
     */
    legs?: readonly AutoMovieHumanSide[];
  }

  /**
   * A trunk inclined forward by an angle shared by the lumbopelvic rhythm: the
   * pelvis pitch it takes and the spine and chest flexion added to the given
   * joints. A backward inclination is the pelvis alone, since leaning back is a
   * pelvic tilt. Result returned by HumanTrunk.incline. The pelvis pitch,
   * degrees, and the joints with the flexion added.
   */
  export type IInclineResult = {
    /**
     * Root pitch in degrees remaining after distributing the inclination among
     * trunk joints.
     */
    pitch: number;
    /** Clinical-degree joint rotations distributing the trunk inclination. */
    joints: IAutoMovieMotionHumanPosture["joints"];
  };

  /**
   * A trunk or head region's world point and outward unit normal on a posture,
   * returned by HumanTrunk.region.
   */
  export type IRegionResult = {
    /** Selected trunk surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward trunk surface unit normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * Where a ray meets the trunk or head colliders of a posture, returned by
   * HumanTrunk.surface. Only the pelvis, spine, chest, neck and head are
   * tested, so an already placed limb does not hide the trunk surface used by a
   * hand rest.
   */
  export type ISurfaceResult = {
    /** Selected trunk surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward trunk surface unit normal in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
