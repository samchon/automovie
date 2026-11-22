/**
 * A hurdle clearance out of a run (#3870): the run is cut at the take-off
 * foot's footfall before the hurdle, that foot pushes off, the lead leg
 * swings over the bar, the trail leg comes round over it, and the lead foot
 * lands beyond, where a run may take the stride on.
 *
 * No duration is authored: the flight is a drag-free parabola timed by the
 * run's horizontal speed over the 1.8 to 2.4 m from the take-off foot to the
 * bar and the 1.1 m of landing beyond it (`hurdleClear.TAKEOFF`,
 * `hurdleClear.LANDING`, provisional bands around McDonald and Dapena 1991);
 * the lead foot then bears 0.04 s before the run takes the stride on
 * (`hurdleClear.SETTLE`).
 *
 * The take-off foot must stand within the hurdle's measured take-off
 * distance (`hurdleClear.TAKEOFF`), and the flight the run's speed gives
 * must carry both legs over the bar; either is refused otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hurdle: Scene id of the hurdle; its `top` bar edge and `bar` depth decide the barrier.
 * @evidence contracts/development/design.md#principled-representation hurdle: A scene id resolved by the law's prop reader through `HumanObstacle`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGymnastics.ts (HumanGymnastics.hurdleClear, params); sport/hurdleClear.ts (hurdleClear.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The take-off and lead feet follow from the run's planted foot; no speed or height is authored.
 */
export namespace IAutoMovieMotionHumanHurdleClear {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The one member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The hurdle's scene id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one value the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The legs are the run's: the planted foot takes off and the other leads.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and approach refusals.
   */
  export interface IParams {
    /** Scene id of the hurdle; its `top` bar edge and `bar` depth decide the barrier. */
    hurdle: string;
  }
}
