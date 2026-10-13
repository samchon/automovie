import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * One source-level shot registration.
 *
 * The export is the artifact: id, staged scene, measurable contract, and
 * deterministic builder travel together so a repository builder can bind
 * module path, export name, and artifact identity without a second manifest
 * claiming what the source contains.
 */
export interface IAutoMovieDefinedShot<Context = undefined> {
  /** Stable shot id; the compiled artifact receives this exact identity. */
  id: string;

  /** Stable staged-scene id the builder must actually produce. */
  scene: string;

  /** Required participants, states, events, coverage, and review evidence. */
  contract: IAutoMovieDefinedShotContract;

  /** Free deterministic code that emits the typed engine program. */
  build(context: Context): IAutoMovieShotProgram;
}
