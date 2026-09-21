import { IAutoMovieExternalMotionHumanoidRetargetMode } from "./IAutoMovieExternalMotionHumanoidRetargetMode";
import { IAutoMovieExternalMotionNativeMode } from "./IAutoMovieExternalMotionNativeMode";

/**
 * Closed authored choice between native use and humanoid retargeting.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Requires the user-selected adoption mode to remain explicit.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the mode union serialized by the adoption decision.
 * @author Samchon
 */
export type IAutoMovieExternalMotionAdoptionMode =
  | IAutoMovieExternalMotionNativeMode
  | IAutoMovieExternalMotionHumanoidRetargetMode;
