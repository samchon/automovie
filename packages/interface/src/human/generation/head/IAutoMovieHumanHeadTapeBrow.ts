/**
 * Brow tape search modes, sagittal ear attachments and dimensionless
 * continuation coordinates.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadTapeBrow in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadTapeBrow {
  /**
   * How the posterior anchor is searched.
   *
   * `complete` scans every original source station and knot midpoint of the
   * ownership interval and refines each observed local maximum: the search's
   * definition of the maximizing course. `continued` refines only the local
   * maximum next to a seed from a neighbouring member of the same source
   * family, and falls back to `complete` whenever the seed is not a local
   * maximum of its two neighbouring scan sites. A continued result is therefore
   * a local maximum; `AutoMovieHumanHeadTape.close` certifies its final member
   * with `complete` before publishing it.
   */
  export type Mode = "complete" | "continued";

  /** Actual unchanged ear attachment in the sagittal calibration-mm chart. */
  export type P2 = readonly [number, number];

  /**
   * Continuation coordinates from an earlier brow-course result. The first slot
   * is the course's anterior coordinate, published as zero by the fixed-brow
   * search; the posterior search reads only the second slot. That slot is the
   * dimensionless share `(back - first) / (brow - first)` of the current
   * ownership interval and must map to a finite station inside that interval. A
   * seed does not certify a maximum: the selected search mode controls the
   * neighbouring-site check and complete-search fallback.
   */
  export type MaximumSeed = readonly [number, number];
}
