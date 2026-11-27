/**
 * A span of a performance whose bodies the physics engine solves instead of the
 * kinematic laws (`AutoMovieMotionHumanPerformance.simulate`): local in time, and in the
 * bodies and parts it names.
 *
 * The window starts at `from` and ends at the 120 Hz grid instant nearest `to`.
 * Inside it the bodies of `subjects` are one simulated world. A body stays
 * kinematic except where an impulse, a grip on another simulated body or a fall
 * makes it physical. A body named in `released` gives up tracking from the
 * window's start, as a body knocked out or thrown in the air does.
 */
export interface IAutoMovieMotionHumanSimulationWindow {
  /** First film second of the window, its frame zero. */
  from: number;

  /** Last film second; the window ends at the 120 Hz grid instant nearest it. */
  to: number;

  /** The performers the solver takes; every performer when absent. */
  subjects?: string[];

  /**
   * Performers whose tracking is withdrawn from the window's start; none when
   * absent.
   */
  released?: string[];
}
