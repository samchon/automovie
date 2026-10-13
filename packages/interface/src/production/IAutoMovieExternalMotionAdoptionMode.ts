import { IAutoMovieExternalMotionHumanoidRetargetMode } from "./IAutoMovieExternalMotionHumanoidRetargetMode";
import { IAutoMovieExternalMotionNativeMode } from "./IAutoMovieExternalMotionNativeMode";

/**
 * Closed authored choice between native use and humanoid retargeting.
 *
 * @author Samchon
 */
export type IAutoMovieExternalMotionAdoptionMode =
  | IAutoMovieExternalMotionNativeMode
  | IAutoMovieExternalMotionHumanoidRetargetMode;
