import type { AutoMovieExternalMotionAdoptionDecision, IAutoMovieExternalMotionNativeDecision, IAutoMovieExternalMotionRetargetDecision } from "@automovie/ingest";
import type { IAutoMovieSkeleton } from "@automovie/interface";
import { test12MotionInspect } from "./test12MotionInspect";

/**
 * Borrowed positive-control results and original refusal closures remain unit-local; factories register callbacks immediately, and those callbacks run only when the owning test invokes its facts.
 *
 * @author Samchon
 */
export interface ITest12MotionAdoptionContext {
  /** Accepted resident-byte inspection shared by the original refusal callbacks. */
  inspection: ReturnType<typeof test12MotionInspect>;

  /** Present motion inventory narrowed by the owning test's positive control. */
  motion: NonNullable<ReturnType<typeof test12MotionInspect>["motion"]>;

  /** Authored provenance fields whose malformed twins exercise admission. */
  source: { path: string; digest: `sha256:${string}`; byteLength: number };

  /** Explicit source rig used by the original adoption decisions. */
  sourceRig: IAutoMovieSkeleton;

  /** Native-mode positive decision reused without introducing a new fixture. */
  nativeDecision: IAutoMovieExternalMotionNativeDecision;

  /** Retarget-mode positive decision varied by the original refusal cases. */
  retargetDecision: IAutoMovieExternalMotionRetargetDecision;

  /** Invoke actual adoption and observe the requested source/decision refusal. */
  rejectsAdoption: (source: ITest12MotionAdoptionContext["source"], decision: AutoMovieExternalMotionAdoptionDecision, message: string) => boolean;

  /** Invoke the owning test's retarget refusal observer with the shared source. */
  rejectsRetarget: (decision: IAutoMovieExternalMotionRetargetDecision, message: string) => boolean;
}
