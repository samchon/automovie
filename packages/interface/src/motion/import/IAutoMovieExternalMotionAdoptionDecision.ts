import type { IAutoMovieExternalMotionNativeDecision } from "./IAutoMovieExternalMotionNativeDecision";
import type { IAutoMovieExternalMotionRetargetDecision } from "./IAutoMovieExternalMotionRetargetDecision";

/**
 * How the author uses one inspected take: replayed on its own rig, or
 * retargeted onto a target rig by the engine later.
 */
export type IAutoMovieExternalMotionAdoptionDecision =
  | IAutoMovieExternalMotionNativeDecision
  | IAutoMovieExternalMotionRetargetDecision;
