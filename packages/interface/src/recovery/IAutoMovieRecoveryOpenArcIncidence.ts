/**
 * Original source support for an observed open arc and its two ordered cut
 * endpoints.
 */
export interface IAutoMovieRecoveryOpenArcIncidence {
  /** Original source triangle IDs supporting the observed arc. */
  faces: ReadonlySet<number>;

  /** Observed first and last point's source edge or vertex addresses. */
  ends: readonly [
    {
      /** First original edge-end vertex address of the observed start point. */
      a: number;

      /** Second original edge-end vertex address of the observed start point. */
      b: number;
    },
    {
      /** First original edge-end vertex address of the observed end point. */
      a: number;

      /** Second original edge-end vertex address of the observed end point. */
      b: number;
    },
  ];
}
