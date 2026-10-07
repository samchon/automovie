/**
 * Geometric output quantities of the generated optical surface.
 * These quantities do not encode illumination adaptation or clinical ranges.
 *
 * @evidence contracts/common.md#principled-implementation Names geometric quantities separately from clinical pupil protocols.
 * @evidence contracts/common.md#clear-and-simple-design One closed vocabulary is shared by the output reader and measurement registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored input value is substituted for a surface measurement.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes geometric output from physiological protocols.
 * @evidence contracts/modeling.md#spatial-conventions The reader returns each length in millimetres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Names the quantity without assigning a measured population value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Names output quantities, not shaping inputs.
 */
export type AutoMovieHumanFaceOpticalMetric = "irisOuterDiameter" | "irisApertureDiameter" | "horizontalLimbusDiameter" | "globeAxialLength" | "centralCornealThickness" | "anteriorCornealRadius" | "irisDepthFromAnteriorSupport";
