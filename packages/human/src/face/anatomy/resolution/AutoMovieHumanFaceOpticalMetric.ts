/**
 * Geometric output quantities of the generated optical surface. These quantities do not encode illumination adaptation or clinical ranges.
 *
 * @evidence contracts/common.md#principled-implementation Seven closed names select geometric quantities of the generated iris/cornea/sclera assembly.
 * @evidence contracts/common.md#clear-and-simple-design The registry and readHumanFaceOpticalMetric share one selection language.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The names do not encode illumination adaptation, refracted apparent diameter or clinical population ranges.
 * @evidence contracts/common.md#meaningful-documentation The reader returns millimetre geometry quantities or a named missing-instrument gap.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Geometry extraction and reconstruction execute in readHumanFaceOpticalMetric.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The common metric union prevents unrelated optical-reader choices, without caching output geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The registry owns selected names and context owns meshes; this erased union acquires no buffer or handle.
 */
export type AutoMovieHumanFaceOpticalMetric =
  | "irisOuterDiameter"
  | "irisApertureDiameter"
  | "horizontalLimbusDiameter"
  | "globeAxialLength"
  | "centralCornealThickness"
  | "anteriorCornealRadius"
  | "irisDepthFromAnteriorSupport";
