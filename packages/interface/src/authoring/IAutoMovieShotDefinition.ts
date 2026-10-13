import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half accepted by the engine's `defineShot` helper.
 *
 * `defineShot` stores this value beside its id without running or validating
 * it; `compileDefinedShot` performs every check when the shot is compiled.
 *
 * @evidence contracts/common.md#principled-implementation `defineShot` spreads this value beside the positional id with no execution, which keeps module evaluation free of side effects and leaves registration, build and program checks to `compileDefinedShot`.
 * @evidence contracts/common.md#clear-and-simple-design Exists so the helper's second argument omits `id`; the same three fields reappear on `IAutoMovieDefinedShot` by restatement rather than through extension of this interface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper applies no defaults and no validation, so a malformed definition surfaces only when compiled; `Context` has no default here, unlike `IAutoMovieDefinedShot`.
 * @evidence contracts/common.md#meaningful-documentation States that `defineShot` stores the value unvalidated and that compilation performs the checks; field docs state the staged-scene and determinism requirements.
 * @author Samchon
 */
export interface IAutoMovieShotDefinition<Context> {
  /** Stable staged-scene id the builder must actually produce. */
  scene: string;

  /** Required participants, states, events, coverage, and review evidence. */
  contract: IAutoMovieDefinedShotContract;

  /**
   * Free deterministic code that emits the typed engine program.
   *
   * `defineShot` stores this function unexecuted; its first call happens when
   * the registration is compiled.
   *
   * @evidence contracts/common.md#principled-implementation Stored unexecuted by `defineShot`, so defining a shot never runs author code at module load and the first call happens inside `compileDefinedShot`.
   * @evidence contracts/common.md#clear-and-simple-design Typed by the definition's `Context` parameter, so the registration and every later compile call agree on the context shape at type-check time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts `defineShot` neither wraps nor rebinds the method; the same function object travels into the registration, so no adapter changes what the builder returns.
   * @evidence contracts/common.md#meaningful-documentation Documents the determinism obligation, the returned program type, and that execution is deferred until compilation.
   */
  build(context: Context): IAutoMovieShotProgram;
}
