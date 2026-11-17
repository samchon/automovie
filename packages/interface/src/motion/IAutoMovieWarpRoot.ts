import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the WarpRoot operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieWarpRoot contracts used by packages/engine/src/motion/warpRoot.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieWarpRoot contract belongs to interface; packages/engine/src/motion/warpRoot.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieWarpRoot {
  /**
   * A root displacement over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieWarpRoot.IWarp keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieWarpRoot.IWarp contract belongs to interface; packages/engine/src/motion/warpRoot.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IWarp {
    /** Translation added by the window's end, metres, parent frame. */
    translation: IAutoMovieVector3;

    /** Turn about +Y added by the window's end, degrees. */
    yaw: number;

    /** Window start, seconds. */
    start: number;

    /** Window end, the named event's instant, seconds. */
    end: number;
  }
}
