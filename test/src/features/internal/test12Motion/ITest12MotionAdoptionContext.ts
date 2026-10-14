import type { AutoMovieExternalMotionAdoptionDecision, IAutoMovieExternalMotionNativeDecision, IAutoMovieExternalMotionRetargetDecision } from "@automovie/ingest";
import type { IAutoMovieSkeleton } from "@automovie/interface";
import { test12MotionInspect } from "./test12MotionInspect";

/**
 * Borrowed positive-control results and original refusal closures remain unit-local; factories register callbacks immediately, and those callbacks run only when the owning test invokes its facts.
 *
 * @author Samchon
 */
export interface ITest12MotionAdoptionContext {
  inspection: ReturnType<typeof test12MotionInspect>;
  motion: NonNullable<ReturnType<typeof test12MotionInspect>["motion"]>;
  source: { path: string; digest: `sha256:${string}`; byteLength: number };
  sourceRig: IAutoMovieSkeleton;
  nativeDecision: IAutoMovieExternalMotionNativeDecision;
  retargetDecision: IAutoMovieExternalMotionRetargetDecision;
  rejectsAdoption: (source: ITest12MotionAdoptionContext["source"], decision: AutoMovieExternalMotionAdoptionDecision, message: string) => boolean;
  rejectsRetarget: (decision: IAutoMovieExternalMotionRetargetDecision, message: string) => boolean;
}
