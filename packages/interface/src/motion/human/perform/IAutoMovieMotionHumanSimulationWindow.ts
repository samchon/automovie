/**
 * A span of a performance whose bodies the physics engine solves instead of
 * the kinematic laws (`HumanPerformance.simulate`): local in time, and in
 * the bodies and parts it names.
 *
 * The window starts at `from` and ends at the 120 Hz grid instant nearest
 * `to`. Inside it the bodies of `subjects` are one simulated world. A body
 * stays kinematic except where an impulse, a grip on another simulated body
 * or a fall makes it physical. A body named in `released` gives up tracking
 * from the window's start, as a body knocked out or thrown in the air does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, the grid snap of the end, which bodies take part and what `released` withdraws.
 * @evidence contracts/development/design.md#principled-representation Film seconds for both ends and subject ids for the bodies; `HumanPerformanceSimulation` refuses an end before the start, a span shorter than one 120 Hz interval and an unknown subject at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the motions performance; `HumanPerformance.simulate` reads it and the window and pair specs author it. `released` exists for a passive body that no impulse in the performance fells, the pair's free fall.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene-specific member; a fall the performance's own laws decide is read from the placed actions, so it needs no flag here.
 */
export interface IAutoMovieMotionHumanSimulationWindow {
  /** First film second of the window, its frame zero. */
  from: number;

  /** Last film second; the window ends at the 120 Hz grid instant nearest it. */
  to: number;

  /** The performers the solver takes; every performer when absent. */
  subjects?: string[];

  /** Performers whose tracking is withdrawn from the window's start; none when absent. */
  released?: string[];
}
