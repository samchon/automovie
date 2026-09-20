import { IAutoMovieBeatEndState, IAutoMovieCompiledContractRealization, IAutoMovieShotSourceOutput } from "@automovie/interface";
import { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";
import { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";

/**
 * Result of the direct shot authoring entry point.
 *
 * @evidence requirements/staging/shot-contracts-and-deliveries.md#staging-delivery-acceptance IAutoMovieCompiledDefinedShot makes delivery acceptance measurable: Result of the direct shot authoring entry point.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-contract-realization-acceptance-status IAutoMovieCompiledDefinedShot realizes inspectable delivery acceptance: Result of the direct shot authoring entry point.
 */
export type IAutoMovieCompiledDefinedShot =
  | {
      /** The registered builder passed every engine gate. */
      success: true;
      /** Compiler-ready source artifact produced by the performShot pipeline. */
      source: IAutoMovieShotSourceOutput;
      /** Independently sampled opening and closing continuity facts. */
      continuity: {
        /** State at shot-local time zero. */
        opening: IAutoMovieBeatEndState;
        /** State at the exclusive shot end. */
        closing: IAutoMovieBeatEndState;
      };
      /** Independent outcomes measured from current scene, motion and camera. */
      realization: IAutoMovieCompiledContractRealization;
      /** D010 suggestions, preserved as decisions rather than imposed motion. */
      advice: readonly IAutoMovieShotPhysicsAdvice[];
    }
  | {
      /** No shot artifact was emitted. */
      success: false;
      /** Every actionable failure discovered at the first failing phase. */
      diagnostics: IAutoMovieAuthoringDiagnostic[];
    };
