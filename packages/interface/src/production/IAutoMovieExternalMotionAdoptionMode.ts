import { IAutoMovieExternalMotionHumanoidRetargetMode } from "./IAutoMovieExternalMotionHumanoidRetargetMode";
import { IAutoMovieExternalMotionNativeMode } from "./IAutoMovieExternalMotionNativeMode";

/**
 * Closed authored choice between native use and humanoid retargeting.
 *
 * @evidence contracts/common.md#principled-implementation Native and humanoid-retarget retain distinct intended decisions: native states mapped-rig compatibility, while retargeting supplies a positive root-translation scale. The union performs no compatibility check or conversion after production host retirement.
 * @evidence contracts/common.md#clear-and-simple-design Two existing mode records form one kind-discriminated union, so native playback cannot accidentally carry retarget-only scale configuration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incompatible native rigs do not silently switch to retargeting; the user must select the other mode and provide its required conversion scale.
 * @evidence contracts/common.md#meaningful-documentation States the closed choice between unretargeted native use and explicit humanoid conversion, with mode-specific semantics owned by the two arm types.
 * @author Samchon
 */
export type IAutoMovieExternalMotionAdoptionMode =
  | IAutoMovieExternalMotionNativeMode
  | IAutoMovieExternalMotionHumanoidRetargetMode;
