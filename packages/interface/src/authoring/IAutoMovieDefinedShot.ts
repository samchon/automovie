import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * One source-level shot registration.
 *
 * The export is the artifact: id, staged scene, measurable contract, and
 * deterministic builder travel together so a repository builder can bind
 * module path, export name, and artifact identity without a second manifest
 * claiming what the source contains. `compileDefinedShot` validates it; an
 * exception thrown by `build` becomes a `builder-failed` diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation A plain value from `defineShot` couples the registration id with scene, contract and builder; `compileDefinedShot` checks the three ids are non-blank, runs `build` once inside a try block, and requires the program's scene id, beats and durations to equal the registration.
 * @evidence contracts/common.md#clear-and-simple-design Restates `scene`, `contract` and `build` with their prose instead of extending `IAutoMovieShotDefinition`, so both declarations must be edited together whenever the registration shape changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `Context` default of `undefined` lets a builder without context omit it; contract realization supplies a synthetic `<defineShot:id>` module pointer because a direct registration carries no module path.
 * @evidence contracts/common.md#meaningful-documentation States that `id` becomes the compiled artifact identity, that `scene` must be the staged id the builder produces, that `build` must be deterministic, and how a throwing builder is reported.
 * @author Samchon
 */
export interface IAutoMovieDefinedShot<Context = undefined> {
  /** Stable shot id; the compiled artifact receives this exact identity. */
  id: string;

  /** Stable staged-scene id the builder must actually produce. */
  scene: string;

  /** Required participants, states, events, coverage, and review evidence. */
  contract: IAutoMovieDefinedShotContract;

  /**
   * Free deterministic code that emits the typed engine program.
   *
   * `compileDefinedShot` calls it once with the caller's context and reports a
   * thrown error as a `builder-failed` diagnostic at `$shot.build`.
   *
   * @evidence contracts/common.md#principled-implementation `compileDefinedShot` calls it exactly once per compilation with the caller's context, converts a throw into a `builder-failed` diagnostic, and validates the returned program against the registration before any engine stage runs.
   * @evidence contracts/common.md#clear-and-simple-design A synchronous method that returns plain data, so the host owns staging, performance and measurement while the source owns only constructing the program.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Determinism is a stated obligation the compiler cannot check: it runs the builder once and never compares two runs, so a builder reading the clock or a random source goes undetected.
   * @evidence contracts/common.md#meaningful-documentation States that the code must be free and deterministic, that it receives the caller's context, and how a throw is reported.
   */
  build(context: Context): IAutoMovieShotProgram;
}
