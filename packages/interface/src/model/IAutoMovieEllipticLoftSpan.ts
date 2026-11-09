/**
 * Aligned elliptical section profiles over one physical Y interval.
 *
 * @evidence contracts/development/design.md#principled-representation Four scalar cubic Bernstein profiles determine aligned elliptical sections independently of tessellation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/development/common.md#meaningful-documentation States metre units, coefficient order, local axes and positive half-axis meaning.
 */
export interface IAutoMovieEllipticLoftSpan {
  /** Lower and upper Y coordinates, in metres. */
  interval: [number, number];

  /** Positive X half-axis Bernstein controls, lower station to upper. */
  radiusX: [number, number, number, number];

  /** Positive Z half-axis controls in the same station chart. */
  radiusZ: [number, number, number, number];

  /** Section-centre X controls in metres. */
  centreX: [number, number, number, number];

  /** Section-centre Z controls in metres. */
  centreZ: [number, number, number, number];
}
