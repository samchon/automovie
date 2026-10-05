/**
 * A tape girth the person evaluates on its whole connected skin.
 *
 * A girth cuts the final skin with the plane through one named skin point of
 * the body view, perpendicular to the segment between two landmarks, keeps the closed
 * section loop nearest the segment, and reports its tape girth (the
 * perimeter of the loop's convex hull, as `measureHumanSection` reads a
 * body girth). The point is read through its sample of the generation's
 * shared source tree, so a site that crosses the head/body cut is read on
 * both halves together. A body view that does not declare the point refuses
 * the rule by name.
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound: a value outside it is outside the population the source
 * measured, not outside what a person can be.
 *
 * @evidence contracts/common.md#principled-implementation The rule is data naming its landmarks and skin point, so the instrument holds no anatomy.
 * @evidence contracts/common.md#clear-and-simple-design One kind with the fields its plane and report need.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source sample range is a report, never a hidden clamp of the request.
 * @evidence contracts/common.md#meaningful-documentation States the cut, the loop choice, the reading and the meaning of the recorded range.
 * @evidence contracts/modeling.md#spatial-conventions Metres; the plane normal is the landmark segment's direction in the model frame.
 * @evidence contracts/anatomy.md#anatomical-source Each rule carries the observed range of the population its definition cites.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule is keyed by the channel its consumers solve, but defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule reads across the boundary but builds none.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed.
 * @evidenceExclude contracts/anatomy.md#permitted-range The recorded range is a source population, not an admission bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rule converts no input.
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
   * The body view's skin landmark (`IAutoMovieHumanBodyBasis.skinLandmarks`)
   * the plane passes through, by name. Its source sample places the plane on
   * the joined skin, whichever partition holds it.
   */
  landmark: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
