import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";

/**
 * The borne body of a coupled carry placed on its bearer: the carry's key
 * posture, the region places both bodies are read at, the anchor bone the borne
 * body rides, its posture carried by that bone at each instant and the bearer's
 * hold places. `HumanCarriedCoupling` states the coupling these read.
 */
export namespace IAutoMovieMotionHumanCarriedCouplingPose {
  /**
   * Where a bearer's hand holds: the held region's point and outward normal, in
   * the bearer's anchor frame.
   */
  export interface IHold {
    /** Metres. */
    point: IAutoMovieVector3;

    /** Unit, out of the borne body. */
    normal: IAutoMovieVector3;

    /** The fingers' tangent in the same frame, when the row directs them. */
    forward?: IAutoMovieVector3;
  }

  /**
   * A bearing hand's contact and the borne segments expressed in the bearing
   * anchor's frame. Applying the displayed anchor pose puts the point and
   * collider frames in world metres and rotates the outward unit normal and
   * optional finger tangent without translating either.
   */
  export interface IGrip extends IHold {
    /** The carried body the bearing arm clears or rests its hand on. */
    clearance: IAutoMovieHumanLimbGoal.IClearance;
  }

  /** A bearer as the borne body reads it at an instant. */
  export interface IBearer {
    /** The bearer's body. */
    body: IAutoMovieMotionHumanBody;

    /** Its displayed bones at the instant. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * Where each hand of a bearer holds, in that bearer's anchor frame: the borne
   * region it holds on the coupling's key pose, left then right; null for a
   * hand that does not hold. Result returned by HumanCarriedCouplingPose.holds.
   * The two holds, each the held region's point and outward normal in that
   * bearer's anchor frame, and the anchor bone.
   */
  export type IHoldsResult = {
    /** Bone anchoring the coupled body's carried pose. */
    anchor: AutoMovieHumanoidBone;
    /**
     * Left and right hand holds in that order; null for a hand that does not
     * hold.
     */
    places: readonly [
      IAutoMovieMotionHumanCarriedCouplingPose.IGrip | null,
      IAutoMovieMotionHumanCarriedCouplingPose.IGrip | null,
    ];
  };

  /**
   * A bearer at the origin in the performer's actual standing posture
   * (`stand.posture`), lowered as a squat by the stance's depth with the trunk
   * inclined by its angle (`bendLower.lower`). The standing alignment, planted
   * feet and minimum knee bend are the same at zero and at every nonzero
   * inclination or depth, so the stance has no finite jump at zero. Input bent
   * of HumanCarriedCouplingPose.stance. The stance: the trunk's forward
   * inclination, degrees, and the lowering, a share of a squat's drop.
   */
  export type IStanceBent = {
    /** Forward trunk inclination in degrees. */
    incline: number;
    /**
     * Lowering as a share of the body's squat drop in [0, 1]; zero is the
     * standing alignment.
     */
    depth: number;
  };

  /**
   * A bearer's bones in its planted stance (`stance`), including at zero: every
   * trial is resolved by the same whole-body kinematics. Input bent of
   * HumanCarriedCouplingPose.stood. The stance.
   */
  export type IStoodBent = {
    /** Forward trunk inclination in degrees. */
    incline: number;
    /**
     * Lowering as a share of the body's squat drop in [0, 1]; zero is the
     * standing alignment.
     */
    depth: number;
  };
}
