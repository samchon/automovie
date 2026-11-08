import { IAutoMovieExternalMotionHumanoidRetargetMode } from "./IAutoMovieExternalMotionHumanoidRetargetMode";
import { IAutoMovieExternalMotionNativeMode } from "./IAutoMovieExternalMotionNativeMode";

/**
 * Closed authored choice between native use and humanoid retargeting.
 *
 * @evidence contracts/development/design.md#principled-representation Native and humanoid-retarget retain distinct intended decisions: native states mapped-rig compatibility, while retargeting supplies a positive root-translation scale. The union performs no compatibility check or conversion after production host retirement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two existing mode records form one kind-discriminated union, so native playback cannot accidentally carry retarget-only scale configuration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Incompatible native rigs do not silently switch to retargeting; the user must select the other mode and provide its required conversion scale.
 * @evidence contracts/development/common.md#meaningful-documentation States the closed choice between unretargeted native use and explicit humanoid conversion, with mode-specific semantics owned by the two arm types.
 */
export type IAutoMovieExternalMotionAdoptionMode =
  | IAutoMovieExternalMotionNativeMode
  | IAutoMovieExternalMotionHumanoidRetargetMode;
