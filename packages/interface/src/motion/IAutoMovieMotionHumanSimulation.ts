import type { IAutoMoviePerformanceMode } from "../physics/IAutoMoviePerformanceMode";
import type { IAutoMoviePhysicalSimulation } from "../physics/IAutoMoviePhysicalSimulation";
import type { IAutoMovieMotionHumanSimulationWindow } from "./IAutoMovieMotionHumanSimulationWindow";

/**
 * One window of a performance baked through the engine's solver
 * (`AutoMovieMotionHumanPerformance.simulate`): the window and mode it was asked for and the
 * engine's completed simulation of it.
 *
 * The simulation's clock is local: its second zero is the window's `from`, and
 * its bodies are the window's subjects under their subject ids. Its
 * `cache.identity` is the digest of every sampled input, so two bakes of the
 * same window agree on it, and its frames are the solved states read for the
 * displayed poses inside the window.
 */
export interface IAutoMovieMotionHumanSimulation {
  /** The window as asked. */
  window: IAutoMovieMotionHumanSimulationWindow;

  /** The physical policy every body of the window takes. */
  mode: IAutoMoviePerformanceMode;

  /** The engine's completed simulation, on the window's local clock. */
  simulation: IAutoMoviePhysicalSimulation;
}
