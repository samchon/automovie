import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half of a shot registration, accepted by the engine's `defineShot` helper.
 *
 * `defineShot` reads scene, contract and build into a new record under its authoritative id, without calling the builder or validating the values. Property access can still invoke author-supplied accessors; registration does not sandbox module side effects. `compileDefinedShot` owns registration and returned-program admission.
 *
 * @evidence contracts/common.md#principled-implementation defineShot selects exactly id, scene, contract and build, dropping runtime extra fields and preventing a definition id from replacing the id argument. After registration-id admission, compileDefinedShot invokes build once and checks the returned program's scene, beat, duration and events before staging, blocking, performance and measurement.
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
   * Required participants, states, events, coverage and review evidence; its `beat` must be non-blank, and the program must carry that beat and its `durationSeconds` on both `blocking` and `performance`.
   */
  contract: IAutoMovieDefinedShotContract;

  /**
   * Deterministic code that returns the typed engine program synchronously.
   *
   * defineShot stores it unexecuted. After registration-id admission, compileDefinedShot calls it once with the caller's context as a method of the returned registration, so a builder must not rely on the original definition as its `this`. A throw becomes builder-failed at `$shot.build`; production source build refuses returned thenables rather than awaiting them.
   *
   * @evidence contracts/common.md#principled-implementation An admitted registration reaches one builder call inside a try; registration refusal makes no call, and a builder throw becomes a located builder-failed diagnostic. The returned program is checked by value; repeat-call determinism remains the author's premise.
   * @evidence contracts/common.md#clear-and-simple-design A single context argument carries every caller-owned input, so the builder needs no registry or global and the same registration compiles under any host that supplies a context.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither caller retries the builder or substitutes a default program after a throw, and an asynchronous result is refused rather than awaited.
   * @evidence contracts/common.md#meaningful-documentation States that registration does not run the builder, the call count and argument at compilation, the synchronous return requirement, and the diagnostic code and path a throw produces.
   */
  build(context: Context): IAutoMovieShotProgram;
}
