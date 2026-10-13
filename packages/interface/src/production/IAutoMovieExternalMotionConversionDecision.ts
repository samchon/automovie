import type { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import type { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * Actor-bound production decision that authorizes one motion conversion.
 *
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
