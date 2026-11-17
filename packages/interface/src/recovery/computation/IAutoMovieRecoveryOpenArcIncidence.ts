/**
 * Original source-face and endpoint incidence of one saved open contour.
 * The two endpoint edge pairs use idempotent canonical source-vertex labels; faces is a borrowed readonly set of original supporting triangle ordinals. The open-slab observer admits their correspondence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes original supporting faces from canonical endpoint labels, preserves saved curve order and states readonly borrowing.
 * @evidence contracts/development/design.md#principled-representation Two endpoint records model start and end; equal labels represent a canonical vertex. The observer requires valid idempotent canonical labels and keeps face support in original source ordinals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Open-continuation row preparation and both slab query implementations share this arc support for endpoint pairing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record supplies topology witnesses only; no source coordinates, fitted replacement curve or proximity-based endpoint match are introduced.
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
