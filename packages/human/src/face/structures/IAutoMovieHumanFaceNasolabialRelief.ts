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
