/**
 * Original source-face and endpoint incidence of one saved open contour. The
 * two endpoint edge pairs use idempotent canonical source-vertex labels; faces
 * is a borrowed readonly set of original supporting triangle ordinals. The
 * open-slab observer admits their correspondence.
 */
export interface IAutoMovieRecoveryOpenArcIncidence {
  /** Supporting original source faces, discarded before publication. */
  faces: ReadonlySet<number>;

  /** Start/end in saved curve order; equal a/b denotes a canonical vertex. */
  ends: readonly [
    {
      /** First canonical connectivity label of the start's supporting edge. */
      a: number;

      /** Second canonical label, equal to a for a source-vertex endpoint. */
      b: number;
    },
    {
      /** First canonical connectivity label of the end's supporting edge. */
      a: number;

      /** Second canonical label, equal to a for a source-vertex endpoint. */
      b: number;
    },
  ];
}
