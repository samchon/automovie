import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half of a shot registration, accepted by the engine's
 * `defineShot` helper.
 *
 * `defineShot` stores this value beside its id without running or validating
 * it, so module evaluation stays free of side effects;
 * `compileDefinedShot` performs every check when the registration is compiled.
 *
 * @evidence contracts/common.md#principled-implementation Defers all work to compile time: `defineShot` returns `{ id, ...definition }` without calling `build`, and `compileDefinedShot` checks the registration ids, calls `build` once, then holds the program to `scene` and to the contract's beat, duration and events before staging, blocking, performing and measuring it.
 * @evidence contracts/common.md#clear-and-simple-design This record is the single declaration of scene, contract and builder; `IAutoMovieDefinedShot` extends it with only the id, so the two halves cannot document or type the same member differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The builder is opaque code the engine never inspects; correctness is judged only from the program it returns, so no source pattern or fixture is recognized specially.
 * @evidence contracts/common.md#meaningful-documentation States when the builder runs, how often, with what argument, that it must return synchronously, how a throw is reported, and that `scene` and the contract bind the returned program.
 * @author Samchon
 */
export interface IAutoMovieShotDefinition<Context = undefined> {
  /**
   * Non-blank staged-scene id; the program's `stage.scene.id` must equal it.
   */
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
   * `defineShot` stores it unexecuted. `compileDefinedShot` calls it once per
   * compilation with the caller's context and reports a thrown error as a
   * `builder-failed` diagnostic at `$shot.build`; the production source build
   * refuses a returned `Promise`.
   *
   * @evidence contracts/common.md#principled-implementation Each compilation calls the builder exactly once inside a `try`, so a throw becomes one located `builder-failed` diagnostic and the returned program is then validated by value; determinism is the author's premise, because the engine cannot verify that a second call returns the same program.
   * @evidence contracts/common.md#clear-and-simple-design A single context argument carries every caller-owned input, so the builder needs no registry or global and the same registration compiles under any host that supplies a context.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither caller retries the builder or substitutes a default program after a throw, and an asynchronous result is refused rather than awaited.
   * @evidence contracts/common.md#meaningful-documentation States that registration does not run the builder, the call count and argument at compilation, the synchronous return requirement, and the diagnostic code and path a throw produces.
   */
  build(context: Context): IAutoMovieShotProgram;
}
