import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieRenderSoftPropFrame } from "../../../render/IAutoMovieRenderSoftPropFrame";
import type { IAutoMovieMotionHumanPerformance } from "../perform/IAutoMovieMotionHumanPerformance";

/** Dimensions and film address of a driven skipping rope. */
export interface IAutoMovieMotionHumanRopeSkipPresentation {
  /** Performance containing the registered `ropeSkip` action. */
  performance: IAutoMovieMotionHumanPerformance;

  /** Placed performer turning the rope. */
  performer: string;

  /** Unique id of a placed `ropeSkip`. Use an anchor for each repeated action. */
  action: string;

  /** Stable scene identity of the cord. */
  subject: string;

  /** Total cord length between its ends, in metres. */
  length: number;

  /** Cord radius, in metres. */
  radius: number;

  /**
   * Length of either rigid handle, in metres. Its barrel is centered at the
   * origin on local Z.
   */
  handleLength: number;

  /**
   * Rigid handle diameter in metres, used to place the barrel beside the palm.
   * Defaults to the measured 7/8-inch handle.
   */
  handleDiameter?: number;
}

/** Presentation records for a driven rope. */
export namespace IAutoMovieMotionHumanRopeSkipPresentation {
  /** Rigid handle placements and the derived tube path at one film instant. */
  export interface IFrame {
    /**
     * Derived unindexed cord surface, ready for the host's soft-prop draw
     * binding.
     */
    cord: IAutoMovieRenderSoftPropFrame;

    /** Rigid barrels fitted to each grasp, with the cord attached on local +Z. */
    handles: Readonly<Record<AutoMovieHumanSide, IAutoMovieRigidTransform>>;
  }
}
