/**
 * Proved contact cap of an attached fan on one original support triangle.
 *
 * Every possible contact of the complete fan with that support lies within
 * `cap` metres of the registered root. The cap reports a possible
 * root-registration contact region; it does not label any other part of the
 * fan as an accepted crossing.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshAttachmentCap {
  /** Original resident support triangle ordinal. */
  triangle: number;

  /**
   * Outward-rounded upper bound, in metres, on any contact point's distance
   * from the registered root.
   */
  cap: number;
}
