import { IAutoMovieDefinedShot } from "../authoring/IAutoMovieDefinedShot";
import { IAutoMovieProductionShotProgram } from "./IAutoMovieProductionShotProgram";
import { IAutoMovieShotBuildContext } from "./IAutoMovieShotBuildContext";

/** Coding-agent-owned module export compiled in a deterministic sandbox. */
export interface IAutoMovieShotSource {
  /** Exact registered shot id selected by the design source pointer. */
  id: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["id"];

  /** Exact staged-scene id the returned program must author. */
  scene: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["scene"];

  /** Measurable source-owned contract, checked against the design contract. */
  contract: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["contract"];

  /**
   * Build a thin stage/block/performance program.
   *
   * The production host, not source code, supplies rig capabilities and runs
   * the engine pipeline that lowers this program into scene, motion, and shot
   * artifacts.
   */
  build(context: IAutoMovieShotBuildContext): IAutoMovieProductionShotProgram;
}
