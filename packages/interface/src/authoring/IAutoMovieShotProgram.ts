import { IAutoMovieScript } from "../harness/IAutoMovieScript";
import { IAutoMovieBlocking } from "./IAutoMovieBlocking";
import { IAutoMoviePerformance } from "./IAutoMoviePerformance";
import { IAutoMovieShotActorProgram } from "./IAutoMovieShotActorProgram";
import { IAutoMovieStage } from "./IAutoMovieStage";

/**
 * Context-free shot program returned by a registered source builder.
 *
 * `compileDefinedShot` requires `stage.scene.id` to equal the registration's
 * scene, both `blocking` and `performance` to carry the contract beat and
 * `durationSeconds` with strict equality, and `eventSamples` to sample each
 * contract event exactly once inside its window, before it stages, blocks and
 * performs the program.
 *
 * @evidence contracts/common.md#principled-implementation Every registration binding is an exact comparison against the contract, reported as a `contract-mismatch` diagnostic before any stage runs; the program then flows through `stageScene`, `blockBeat` and `performShot` in that order, and the event samples are compared with each contract window `[from, to]` inclusive.
 * @evidence contracts/common.md#clear-and-simple-design The program bundles the inputs each pipeline gate already owns, script, stage, blocking and performance, and adds only the actor runtime facts and event samples that no gate input carries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mismatched beat, duration or scene is refused rather than overwritten from the contract, and an undeclared or repeated event sample is refused rather than ignored.
 * @evidence contracts/common.md#meaningful-documentation States each binding to the registration, which gate reads each member, the time unit and window rule for event samples, and what the actor facts cover.
 * @author Samchon
 */
export interface IAutoMovieShotProgram {
  /**
   * Runtime facts for the staged actors whose verbs need a measured speed or
   * eye height, at most one entry per `stage.actors` node.
   *
   * Geometry and gait curves remain builder-owned through
   * {@link IAutoMovieShotActorProgram.model}; the source states only the
   * scale-dependent values a generic builder cannot infer without guessing.
   */
  actors: IAutoMovieShotActorProgram[];

  /** The film's script, whose beats must include the registered beat. */
  script: IAutoMovieScript;

  /** Set declaration whose `scene.id` must equal the registration's scene. */
  stage: IAutoMovieStage;

  /** Checked plan that the action program must realize. */
  blocking: IAutoMovieBlocking;

  /** Thin verb program compiled by the engine. */
  performance: IAutoMoviePerformance;

  /**
   * One authoritative sample time for every event the contract declares,
   * inside that event's window; undeclared or repeated ids are refused.
   */
  eventSamples: Array<{
    /** Id of an event the registered contract declares. */
    id: string;

    /**
     * Finite shot-local measurement time in seconds, within the event's
     * contract window inclusive.
     */
    time: number;
  }>;
}
