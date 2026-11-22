import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieEnvironmentModule } from "./IAutoMovieEnvironmentModule";

/**
 * An occurrence of a named environment definition, with an optional rigid placement.
 *
 * @evidence contracts/development/design.md#principled-representation At is either a position in local metres or a named anchor with a relative metre offset. A unit quaternion acts in the selected parent frame. Missing location and rotation are a zero offset and the identity turn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The definition supplies the module contents. Placement supplies their pose once. Socket references reuse named producer frames.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The composer refuses nonfinite offsets, nonunit rotations and bad anchor references. Authored item poses are rigid to keep contact and support frames coherent.
 * @evidence contracts/development/common.md#meaningful-documentation States the definition, placement alternatives, frames and defaults.
 */
export interface IAutoMovieEnvironmentItem {
  /** Reusable definition instantiated with this occurrence's pose and id. */
  use: IAutoMovieEnvironmentModule;

  /** Position in environment-local metres, or attachment to another item or its anchor. */
  at?:
    | IAutoMovieVector3
    | {
        /** Environment-relative item key or `item/anchor` path. */
        anchor: string;

        /** Translation in the anchor's frame in metres, defaulting to zero. */
        offset?: IAutoMovieVector3;
      };

  /** Turn in the environment or anchor's frame, defaulting to the identity. */
  rotation?: IAutoMovieQuaternion;
}
