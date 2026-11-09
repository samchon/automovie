import type { IAutoMovieExternalMotionNativeDecision } from "./IAutoMovieExternalMotionNativeDecision";
import type { IAutoMovieExternalMotionRetargetDecision } from "./IAutoMovieExternalMotionRetargetDecision";

/**
 * How the author uses one inspected take: replayed on its own rig, or retargeted onto a target rig by the engine later.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on `mode` lets TypeScript narrow the retarget-only fields, and adoption checks the discriminant at run time for untyped callers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The alias names the two supported uses in one place so adoption's parameter and the receipt's `mode` field derive from it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the two declared modes exist; adoption throws on any other discriminant instead of defaulting to native playback.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what each arm means for the take: replay on its own rig or a later engine retarget.
 */
export type AutoMovieExternalMotionAdoptionDecision =
  | IAutoMovieExternalMotionNativeDecision
  | IAutoMovieExternalMotionRetargetDecision;
