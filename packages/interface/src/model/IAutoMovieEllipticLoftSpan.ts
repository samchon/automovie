/**
 * Aligned elliptical section profiles over one physical Y interval.
 *
 * @evidence contracts/common.md#principled-implementation Four scalar cubic Bernstein profiles determine aligned elliptical sections independently of tessellation.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation States metre units, coefficient order, local axes and positive half-axis meaning.
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
