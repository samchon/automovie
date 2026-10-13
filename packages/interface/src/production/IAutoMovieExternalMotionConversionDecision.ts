import type { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import type { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * Actor-bound production decision that authorizes one motion conversion.
 *
 * @evidence contracts/common.md#principled-implementation Shot, actor and clip bind one reviewed mapping and mode to its actual consumer; native decisions record null translation scale while retarget decisions retain the explicit positive scale used in conversion.
 * @evidence contracts/common.md#clear-and-simple-design The receipt projects the executable adoption choices without duplicating full source bytes or target skeleton, which remain separate pinned receipt groups.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Same-rig actors do not inherit another actor's conversion, and native adoption cannot be represented as an undisclosed scaled retarget by writing an arbitrary translation factor.
 * @evidence contracts/common.md#meaningful-documentation Gives actor-bound shot and clip ownership, exact source-node mapping, mode and the native-null versus retarget-scale distinction.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionDecision {
  /** Production shot that owns the adopted motion. */
  shot: string;

  /** Actor identity that consumes the converted motion. */
  actor: string;

  /** Authored clip identity receiving the converted motion. */
  clip: string;

  /** Native or humanoid-retarget conversion mode. */
  mode: IAutoMovieExternalMotionAdoptionMode["kind"];

  /** Reviewed source-node to target-bone mapping. */
  mapping: IAutoMovieExternalMotionMappingEntry[];

  /** Explicit root-translation scale, or null for native adoption. */
  translationScale: number | null;
}
