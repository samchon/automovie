import type { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import type { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half of a shot registration, accepted by the engine's
 * `defineShot` helper.
 *
 * `defineShot` reads scene, contract and build into a new record under its
 * authoritative id, without calling the builder or validating the values.
 * Property access can still invoke author-supplied accessors; registration does
 * not sandbox module side effects. `compileDefinedShot` owns registration and
 * returned-program admission.
 */
export interface IAutoMovieShotDefinition<Context = undefined> {
  /** Non-blank staged-scene id; the program's `stage.scene.id` must equal it. */
  scene: string;

  /**
   * Required participants, states, events, coverage and review evidence; its
   * `beat` must be non-blank, and the program must carry that beat and its
   * `durationSeconds` on both `blocking` and `performance`.
   */
  contract: IAutoMovieDefinedShotContract;

  /**
   * Deterministic code that returns the typed engine program synchronously.
   *
   * DefineShot stores it unexecuted. After registration-id admission,
   * compileDefinedShot calls it once with the caller's context as a method of
   * the returned registration, so a builder must not rely on the original
   * definition as its `this`. A throw becomes builder-failed at `$shot.build`;
   * production source build refuses returned thenables rather than awaiting
   * them.
   */
  build(context: Context): IAutoMovieShotProgram;
}
