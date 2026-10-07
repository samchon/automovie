/**
 * Numerical relief of one nasolabial crease on the connected source skin.
 * Rest depth is persistent identity; smile depth is additional relief at this
 * side's `mouthSmileLeft` or `mouthSmileRight` weight one. Neither value is a
 * clinical grade, age, fat volume or measured tissue modulus. The source's
 * existing fold remains, so these are additional authored depths.
 *
 * The named alar-curvature and cheilion points define the supported guide. Its
 * projection and smooth endpoint fade are a geometric convention, not a
 * reconstruction of the nasolabial fold's individual anatomical course.
 * Geometry and contact admission still judge combinations with shape and
 * motion. Omission of a side adds no relief and never copies its opposite.
 * Support must remain on that side of the source's midsagittal plane and
 * include a source sample. This is a geometry-dependent authoring limit, not
 * a clinical wrinkle-width range. Export rounding can hide tiny amplitudes.
 *
 * @evidence contracts/common.md#principled-implementation Separate millimetre amplitudes retain identity and requested performance without converting an ordinal observation.
 * @evidence contracts/common.md#clear-and-simple-design One crease carries two independent amplitudes and a support width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject geometry or clinical grade is embedded in the inputs.
 * @evidence contracts/common.md#meaningful-documentation States the additional-depth meaning, guide convention and downstream admission.
 * @evidence contracts/modeling.md#parameter-channels Zero adds no relief; increasing either nonnegative depth deepens its own resting or performed contribution, while width broadens support.
 * @evidence contracts/modeling.md#spatial-conventions Depth and transverse support radius are millimetres, converted once by the relief owner to basis metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The settings name a skin trait, not a new part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The relief owner holds the registered lip margin and guide endpoints.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected relief owner observes the skin and its neighbors.
 * @evidence contracts/anatomy.md#anatomical-source This is additional authored visible relief along the source's registered anatomical endpoints; it has no calibrated photonumeric or clinical tissue mapping.
 * @evidenceExclude contracts/anatomy.md#permitted-range The connected relief and contact owners admit values and geometry combinations.
 * @evidence contracts/anatomy.md#parametric-authority The input is a named regional depth and width, with no personal vertices or curves.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceNasolabialRelief {
  /** Additional resting depth in mm; finite and nonnegative, default zero. */
  restDepthMm?: number;

  /** Additional depth at this side's full smile; finite and nonnegative, default zero. */
  smileDepthMm?: number;

  /** Positive finite transverse support radius in mm, within the live side's supported source reach. */
  widthMm: number;
}
