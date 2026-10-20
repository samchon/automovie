import {
  IAutoMovieBeatEndState,
  IAutoMovieCompiledContractRealization,
  IAutoMovieShotSourceOutput,
} from "@automovie/interface";

import { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";
import { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";

/**
 * What `compileDefinedShot` returns for one registered shot: the compiled
 * source with its measured continuity, contract realization and physics advice,
 * or the diagnostics of the first phase that failed.
 *
 * The phases run in order: registration, build, program contract and advice,
 * stage, blocking, resumed stage, performance, contract realization, and
 * continuity. An exception from the builder or any later phase is translated
 * into a diagnostic rather than thrown, so a caller handles one value.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`; the success branch exists only after every phase passed, and continuity is sampled from the compiled scene, motions, mounts and plants by `resolveBeatOpening` and `resolveBeatEnd` rather than copied from the program, with the opening's gait phase, root velocity, foot plants and mount carried from the previous beat when one is supplied.
 * @evidence contracts/common.md#clear-and-simple-design The success branch groups what a caller such as `productionShotAssembly` reads after one compile, the source, its two continuity boundaries, the realization grade and the advice decisions, so the caller never recompiles to learn any of them; the failure branch carries diagnostics only, because no partial artifact is trustworthy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Advice is validated and deep-cloned, never applied to motion by the compiler, and a realization failure tells the author to correct the stage or camera rather than the contract prose, so no branch is reached by echoing the output into the contract.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the phase order, that exceptions become diagnostics, what each success field holds and how continuity and advice are derived, and that a failure lists every diagnostic of the first failing phase only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the pipeline cost is answered on `compileDefinedShot` and the phases it calls.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call compiles one shot from its builder output; caching compiled shots across calls is the production builder's concern, not this result's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The success branch owns fresh scene, motion, continuity and realization objects plus deep clones of the event samples and advice; it references no runtime capability object, so it is released with the caller's result.
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
