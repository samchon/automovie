/**
 * A tape girth the person evaluates on its whole connected skin.
 *
 * A girth cuts the final skin with the plane through one named skin point of the body view, perpendicular to the segment between two landmarks, keeps the closed section loop nearest the segment, and reports its tape girth (the perimeter of the loop's convex hull, as `measureHumanSection` reads a body girth). The point is read through its sample of the generation's shared source tree, so a site that crosses the head/body cut is read on both halves together. A body view that does not declare the point refuses the rule by name. The observed range of the cited source sample is recorded for reporting, not as a bound: a value outside it is outside the population the source measured, not outside what a person can be.
 *
 * @evidence contracts/common.md#principled-implementation A named skin sample places a plane perpendicular to a landmark segment; the nearest closed joined-skin loop supplies the convex-hull tape perimeter.
 * @evidence contracts/common.md#clear-and-simple-design The rule names measurement landmarks and population observations while joined-skin construction and section measurement remain with their numerical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed source extrema are reporting metadata rather than clamps; unsupported source landmarks refuse instead of moving the plane to a convenient site.
 * @evidence contracts/common.md#meaningful-documentation The declaration states plane placement, loop selection, tape protocol, cross-partition source sample identity and metre extrema without claiming biological admissibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The whole-person tape-girth protocol descriptors specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the whole-person tape-girth protocol descriptors; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The whole-person tape-girth protocol descriptors acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGirthMeasurement {
  /** A tape girth on one plane. */
  kind: "girth";

  /** Landmark id where the measured segment starts. */
  from: string;

  /** Landmark id where the measured segment ends; the plane is perpendicular to the segment. */
  to: string;

  /**
   * The body view's skin landmark (`IAutoMovieHumanBodyBasis.skinLandmarks`) the plane passes through, by name. Its source sample places the plane on the joined skin, whichever partition holds it.
   */
  landmark: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
