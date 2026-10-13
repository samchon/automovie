import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Travel across the floor on a gait; engine: locomotion + `travelMotion`.
 *
 * `gait` names one of the gaits the actor's context actually supplies
 * ({@link IAutoMovieGait.name}); it is matched by name, so the vocabulary is the
 * actor's own, not a fixed set: a biped declares `walk`/`run`/`sprint`/
 * `sneak`/`march`, a horse declares `walk`/`trot`/`canter`/`gallop`, a cat
 * `walk`/`stalk`/`pounce`. Naming a gait the actor did not supply is a
 * validation error (the shot's perform gate reports it), not a silent freeze,
 * so the schema's free string cannot drift from the runtime's actual set.
 */
export interface IAutoMovieLocomoteAction extends IAutoMovieActionBase {
  /** Selects locomotion as the action family. */
  verb: "locomote";

  /** Name of the actor-provided gait used for the travel action. */
  gait: string;

  /** Where to go (the engine sizes the gait cycles to cover the distance). */
  to: IAutoMovieActionTarget;

  /** Face the travel direction (false keeps facing a separate look target). */
  faceTravel?: boolean;
}
