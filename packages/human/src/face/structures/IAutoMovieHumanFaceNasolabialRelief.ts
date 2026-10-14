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
 * @evidence contracts/common.md#principled-implementation applyHumanFaceNasolabialRelief adds rest plus this side's smile-weighted depth along the live skin normal on a registered material course, holding the lip margin and guide endpoints.
 * @evidence contracts/common.md#clear-and-simple-design Independent rest/smile depths and one transverse width describe additional relief over the existing source fold; the parent selects anatomical side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Active relief requires same-skin alar/cheilion and lip registrations, material-course support, a side-contained width and a contributing source sample; no ordinal grade or hidden tissue mechanics is inferred and zero active depth adds nothing.
 * @evidence contracts/common.md#meaningful-documentation Millimetre units, source-smile ownership, omission and export-rounding limits distinguish desired authored depth from an observed clinical fold.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no course compilation or skin displacement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current course/contact-reference derivatives belong to the pose owner rather than a cache in this schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three optional/scalar inputs acquire no skin host, query or mesh buffer.
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
