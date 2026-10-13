import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half accepted by the engine's `defineShot` helper.
 *
 * `defineShot` stores this value beside its id without running or validating
 * it; `compileDefinedShot` performs every check when the shot is compiled.
 *
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
   */
  build(context: Context): IAutoMovieShotProgram;
}
