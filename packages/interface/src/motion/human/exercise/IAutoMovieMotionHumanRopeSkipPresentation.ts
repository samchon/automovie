import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieRenderSoftPropFrame } from "../../../render/IAutoMovieRenderSoftPropFrame";
import type { IAutoMovieMotionHumanPerformance } from "../perform/IAutoMovieMotionHumanPerformance";

/**
 * Dimensions and film address of a driven skipping rope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the action address and dimensions, with the cord measured between the handle tips.
 * @evidence contracts/development/design.md#principled-representation Uses metre dimensions and an anchored action on the performance's film clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The presentation reads the placed action and pose through the performance. The host supplies the cable and handle dimensions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Handle mounts and cord shape stay coupled to the same displayed hand samples. No dynamics parameters are implied.
 */
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

  /** Length of either rigid handle, in metres. Its barrel is centered at the origin on local Z. */
  handleLength: number;

  /** Rigid handle diameter in metres, used to place the barrel beside the palm. Defaults to the measured 7/8-inch handle. */
  handleDiameter?: number;
}

/**
 * Presentation records for a driven rope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the unintegrated world-space cord and both world-space handle frames.
 * @evidence contracts/development/design.md#principled-representation Keeps the derived cord and two rigid transforms on the same film sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The host positions the handle models and passes the cord to the existing soft surface adapter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No render objects, solver populations or retained frame history cross the boundary.
 */
export namespace IAutoMovieMotionHumanRopeSkipPresentation {
  /**
   * Rigid handle placements and the derived tube path at one film instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States handle axes, attachment points and world-space ownership.
   * @evidence contracts/development/design.md#principled-representation Both handle transforms and four cord positions use world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses rigid transforms and the render soft-prop frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both handle tips attach to the emitted cord at their drawn coordinates.
   */
  export interface IFrame {
    /** Derived unindexed cord surface, ready for the host's soft-prop draw binding. */
    cord: IAutoMovieRenderSoftPropFrame;

    /** Rigid barrels fitted to each grasp, with the cord attached on local +Z. */
    handles: Readonly<Record<AutoMovieHumanSide, IAutoMovieRigidTransform>>;
  }
}
