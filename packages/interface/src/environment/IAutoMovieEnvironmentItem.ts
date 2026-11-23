import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieEnvironmentModule } from "./IAutoMovieEnvironmentModule";

/**
 * An occurrence of a named environment definition, with an optional rigid
 * placement.
 */
export interface IAutoMovieEnvironmentItem {
  /** Reusable definition instantiated with this occurrence's pose and id. */
  use: IAutoMovieEnvironmentModule;

  /**
   * Position in environment-local metres, or attachment to another item or its
   * anchor.
   */
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
