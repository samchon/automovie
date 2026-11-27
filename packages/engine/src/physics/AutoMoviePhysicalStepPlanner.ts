/** Plans fixed-step runs and their snapshot cadence. */
export namespace AutoMoviePhysicalStepPlanner {
  /**
   * The fixed steps a dynamic run performs and the completed steps it snapshots
   * (`AutoMoviePhysicalSimulation.compute`).
   *
   * A run resumed after `start` completed steps performs steps `start + 1`
   * through `count`. After each of them that is a multiple of the declared
   * cadence it keeps a native world snapshot with the controller and balance
   * state, so a later edit can resume from the last one before it
   * (`checkpointPhysicalSimulation`). A fresh run also snapshots the film's first
   * state, step 0, before its first step; that snapshot is not one of these.
   *
   * @param start Completed steps the run resumes after, a snapshot step of the
   *   previous run; 0 for a fresh run.
   * @param count The film's fixed steps, its duration times its rate.
   * @param every The admitted snapshot cadence in fixed steps, a positive safe
   *   integer (`IAutoMoviePhysicalSimulationInput.IInput.checkpointEvery`).
   * @returns The number of steps the run performs and, in increasing order, the
   *   steps after which it snapshots; none when `start` is `count`.
   */
  export function plan(
    start: number,
    count: number,
    every: number,
  ): IResult {
    const snapshots: number[] = [];

    // The cadence's first multiple after the resumed step, then one each
    // cadence up to the film's last step.
    for (
      let step: number = (Math.floor(start / every) + 1) * every;
      step <= count;
      step += every
    )
      snapshots.push(step);
    return { steps: count - start, snapshots };
  }

  /** What one dynamic run steps and snapshots. */
  export interface IResult {
    /** The fixed steps the run performs, its `recomputedSteps`. */
    steps: number;

    /** The completed steps after which it snapshots, increasing. */
    snapshots: number[];
  }
}
