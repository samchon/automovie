export namespace AutoMovieMotionHumanArmPlannedData {
  /*
   * The farthest probe's travel between two waypoints of a reach first cut,
   * metres (provisional: a sampling density, not a bound; the solve splits any
   * interval its frame-grid reading fails in).
   */
  export const SPACING: number = 0.08;

  /*
   * A daily reach's peak hand speed, metres a second (J NeuroEng Rehabil 2006
   * 3:18).
   */
  export const PEAK: number = 0.55;
}
