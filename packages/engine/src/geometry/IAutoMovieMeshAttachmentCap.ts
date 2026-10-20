/**
 * Proved contact cap of an attached fan on one original support triangle.
 *
 * Every possible contact of the complete fan with that support lies within
 * `cap` metres of the registered root. The cap reports a possible
 * root-registration contact region; it does not label any other part of the
 * fan as an accepted crossing, and other resident triangles still need their
 * own strict separation proof.
 *
 * @evidence contracts/common.md#principled-implementation The cap is `boundAutoMovieTriangleAttachmentContact`'s barycentric bound, root deficit over deficit plus corner gap times the largest corner L1 distance, with every step rounded outward, so it encloses every contact point rather than sampling a nearest one.
 * @evidence contracts/common.md#clear-and-simple-design The separation query keeps only the support ordinal and the cap from the full contact bound, because a caller needs where contact may occur and how far it may reach, not the intermediate gap and deficit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cap is pushed only after the bound proved a positive corner gap; an unproved support ends the query uncertified instead of reporting a zero or default cap.
 * @evidence contracts/common.md#meaningful-documentation States that `triangle` is the original resident ordinal, that `cap` is an outward-rounded metre bound from the registered root, and that the cap licenses no other contact.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the bound is computed in constant time per support by its producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per support per query; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two scalars; the result holds one record per declared attachment support.
 */
export interface IAutoMovieMeshAttachmentCap {
  /** Original resident support triangle ordinal, one of the attachment's declared supports. */
  triangle: number;

  /**
   * Outward-rounded upper bound, in metres, on any contact point's distance
   * from the registered root.
   */
  cap: number;
}
