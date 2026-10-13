import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/** The source-authored half accepted by the engine's `defineShot` helper. */
export interface IAutoMovieShotDefinition<Context> {
  /** Stable staged-scene id the builder must actually produce. */
  scene: string;

  /** Required participants, states, events, coverage, and review evidence. */
  contract: IAutoMovieDefinedShotContract;

  /** Free deterministic code that emits the typed engine program. */
  build(context: Context): IAutoMovieShotProgram;
}
