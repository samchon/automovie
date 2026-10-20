import type { IAutoMovieExternalMotionNativeDecision } from "./IAutoMovieExternalMotionNativeDecision";
import type { IAutoMovieExternalMotionRetargetDecision } from "./IAutoMovieExternalMotionRetargetDecision";

/**
 * How the author uses one inspected take: replayed on its own rig, or retargeted onto a target rig by the engine later.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `mode` lets TypeScript narrow the retarget-only fields, and adoption checks the discriminant at run time for untyped callers.
 * @evidence contracts/common.md#clear-and-simple-design The alias names the two supported uses in one place so adoption's parameter and the receipt's `mode` field derive from it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the two declared modes exist; adoption throws on any other discriminant instead of defaulting to native playback.
 * @evidence contracts/common.md#meaningful-documentation The comment states what each arm means for the take: replay on its own rig or a later engine retarget.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A union alias has no runtime code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The decision alias only names two record shapes and performs no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias exists only at compile time, so it allocates and retains nothing at run time.
 */
export type AutoMovieExternalMotionAdoptionDecision =
  | IAutoMovieExternalMotionNativeDecision
  | IAutoMovieExternalMotionRetargetDecision;
