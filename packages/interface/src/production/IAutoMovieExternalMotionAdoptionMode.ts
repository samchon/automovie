import type { IAutoMovieExternalMotionHumanoidRetargetMode } from "./IAutoMovieExternalMotionHumanoidRetargetMode";
import type { IAutoMovieExternalMotionNativeMode } from "./IAutoMovieExternalMotionNativeMode";

/** Closed authored choice between native use and humanoid retargeting. */
export type IAutoMovieExternalMotionAdoptionMode =
  | IAutoMovieExternalMotionNativeMode
  | IAutoMovieExternalMotionHumanoidRetargetMode;
