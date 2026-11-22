import type { IAutoMoviePerformanceMode } from "../../../physics/IAutoMoviePerformanceMode";
import type { IAutoMoviePhysicalSimulation } from "../../../physics/IAutoMoviePhysicalSimulation";
import type { IAutoMovieMotionHumanSimulationWindow } from "./IAutoMovieMotionHumanSimulationWindow";

/**
 * One window of a performance baked through the engine's solver
 * (`HumanPerformance.simulate`): the window and mode it was asked for and
 * the engine's completed simulation of it.
 *
 * The simulation's clock is local: its second zero is the window's `from`,
 * and its bodies are the window's subjects under their subject ids. Its
 * `cache.identity` is the digest of every sampled input, so two bakes of the
 * same window agree on it, and its frames are the solved states read for
 * the displayed poses inside the window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the local clock, the body ids and what the identity and frames are used for.
 * @evidence contracts/development/design.md#principled-representation The window in film seconds, the engine's mode union and the engine's own simulation result; the simulation's input fixes its rate, duration and bodies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the motions performance, which reads the cache for poses; the window and pair specs read the identity, frames and input to check determinism, contact, bindings and momentum.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's simulation and mode types instead of copying their members.
 */
export interface IAutoMovieMotionHumanSimulation {
  /** The window as asked. */
  window: IAutoMovieMotionHumanSimulationWindow;

  /** The physical policy every body of the window takes. */
  mode: IAutoMoviePerformanceMode;

  /** The engine's completed simulation, on the window's local clock. */
  simulation: IAutoMoviePhysicalSimulation;
}
