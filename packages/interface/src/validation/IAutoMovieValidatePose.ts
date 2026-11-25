import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Data and callback contracts shared by the ValidatePose operations. */
export namespace IAutoMovieValidatePose {
  /**
   * Admit skeleton identity, optional root transform, duplicate/undeclared
   * joint bones and effective rig/default ROM.
   */
  export type IProps = {
    /**
     * Borrowed pose; null joint angles mean rest and invalid angles are
     * reported without clamping.
     */
    pose: IAutoMoviePose;

    /** Current rig for bone identity and per-bone/default degree constraints. */
    skeleton: IAutoMovieSkeleton;

    /** Base diagnostic address, defaulting to $input. */
    path?: string;

    /** Optional caller-owned sink; omitted, a fresh collector is returned. */
    collector?: IAutoMovieViolationCollector;
  };
}
