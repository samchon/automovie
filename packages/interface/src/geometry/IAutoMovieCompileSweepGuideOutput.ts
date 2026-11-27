/** Wrapped direction and its independently compiled radius profile. */
export interface IAutoMovieCompileSweepGuideOutput {
  /** Radians in one turn. */
  angle: number;

  /** Radius in metres, positive and finite at a successful query. */
  radius: (u: number) => number;
}
