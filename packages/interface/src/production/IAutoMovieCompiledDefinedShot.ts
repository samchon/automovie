import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";
import type { IAutoMovieCompiledContractRealization } from "./IAutoMovieCompiledContractRealization";
import type { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";
import type { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/**
 * What `compileDefinedShot` returns for one registered shot: the compiled
 * source with its measured continuity, contract realization and physics advice,
 * or the diagnostics of the first phase that failed.
 *
 * The phases run in order: registration, build, program contract and advice,
 * stage, blocking, resumed stage, performance, contract realization, and
 * continuity. An exception from the builder or any later phase is translated
 * into a diagnostic rather than thrown, so a caller handles one value.
 */
export type IAutoMovieCompiledDefinedShot =
  | {
      /** Every phase passed. */
      success: true;

      /**
       * Compiler-ready source: the staged scene, the performed motions, the
       * assembled shot, and a deep clone of the program's event samples.
       */
      source: IAutoMovieShotSourceOutput;

      /** Beat state sampled at the compiled shot's two boundaries. */
      continuity: {
        /**
         * State at shot-local time zero. When the runtime supplied a previous
         * beat, each actor present in both keeps that beat's gait phase, root
         * velocity, foot plants and mount.
         */
        opening: IAutoMovieBeatEndState;

        /** State at the exclusive shot end, the next beat's `previous`. */
        closing: IAutoMovieBeatEndState;
      };

      /**
       * Contract outcomes measured independently from the compiled scene,
       * motions and camera against the registered shot contract.
       */
      realization: IAutoMovieCompiledContractRealization;

      /**
       * Deep clone of the runtime's physics advice after validation: each
       * engine-proposed collision response with the author's decision, kept as
       * a record and never applied to motion by the compiler. Empty when the
       * runtime supplied none.
       */
      advice: readonly IAutoMovieShotPhysicsAdvice[];
    }
  | {
      /** No shot artifact was emitted. */
      success: false;

      /**
       * Every diagnostic from the first phase that failed; later phases did not
       * run. An unexpected exception yields one `pipeline-failed` diagnostic
       * naming the phase it escaped from.
       */
      diagnostics: IAutoMovieAuthoringDiagnostic[];
    };
