import { IAutoMovieDefinedShot } from "../authoring/IAutoMovieDefinedShot";
import { IAutoMovieProductionShotProgram } from "./IAutoMovieProductionShotProgram";
import { IAutoMovieShotBuildContext } from "./IAutoMovieShotBuildContext";

/**
 * Coding-agent-owned synchronous defineShot registration loaded by the production host through ordinary Node execution.
 *
 * @evidence contracts/common.md#principled-implementation The source linker selects an exact module and export, checks registration id, nonblank scene and canonical measurable contract equality, then validates the thin returned production program before engine lowering.
 * @evidence contracts/common.md#clear-and-simple-design Registration identity and contract sit beside one context-to-program build method, while the host supplies capabilities and owns dense scene, motion and shot materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Promise results and mismatched registrations refuse; ordinary Node execution currently supplies no deterministic sandbox, filesystem isolation or deep input freeze, so those properties are author obligations rather than enforced guarantees.
 * @evidence contracts/common.md#meaningful-documentation Defines exact registration identity, scene and contract matching, synchronous thin program construction and the actual host execution boundary.
 * @author Samchon
 */
export interface IAutoMovieShotSource {
  /** Exact registered shot id selected by the design source pointer. */
  id: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["id"];

  /** Exact staged-scene id the returned program must author. */
  scene: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["scene"];

  /** Measurable source-owned contract, checked against the design contract. */
  contract: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["contract"];

  /**
   * Build a synchronous thin stage/block/performance program from the supplied current context.
   *
   * The production host, not source code, supplies rig capabilities and runs the engine pipeline that lowers this program into scene, motion, and shot artifacts.
   *
   * @evidence contracts/common.md#principled-implementation The host invokes the admitted registration's build method once with current design and runtime context, rejects Promise output and validates the returned program before deterministic engine compilation.
   * @evidence contracts/common.md#clear-and-simple-design A synchronous context-to-program method keeps source authoring separate from host capability provision, persistent publication and dense engine output.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This method is ordinary authored Node code, not an isolated sandbox; returning structurally valid data does not bypass downstream ROM, source ownership, spatial or contract realization gates.
   * @evidence contracts/common.md#meaningful-documentation States the synchronous thin-program result, host-supplied capability ownership and subsequent engine lowering.
   */
  build(context: IAutoMovieShotBuildContext): IAutoMovieProductionShotProgram;
}
