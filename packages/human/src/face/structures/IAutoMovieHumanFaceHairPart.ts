/**
 * A named sagittal scalp part. Position is relative to the shared growth domain's chart origin, with anatomical left at positive X. It divides a population through the existing continuous tangent field, without storing a private guide curve. Width and hold are authored styling lengths, not measured follicular anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Named traits retain their independent units and neutral meaning without per-strand coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One record owns one styling responsibility and the expander owns its unit conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, clinical reconstruction or private geometry is selected.
 * @evidence contracts/common.md#meaningful-documentation Each trait states its units and the description states the scientific limitation.
 * @evidence contracts/modeling.md#parameter-channels Independent traits preserve their stated neutral or absolute styling meaning.
 * @evidence contracts/modeling.md#spatial-conventions Lengths use millimetres, angles use degrees and appearance uses dimensionless linear RGB fractions; the expander converts once.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The population layer owns the hair part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The hair builder emits the population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Shared growth-domain registration owns attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair assembly observes the realised styling.
 * @evidence contracts/anatomy.md#anatomical-source Values are authored styling targets without a measured biological population or acquisition protocol; clinical calibration is unknown.
 * @evidenceExclude contracts/anatomy.md#permitted-range Runtime admission checks numerical styling constraints, not physiological bounds.
 * @evidence contracts/anatomy.md#parametric-authority Only named lengths, angles, closed choices and appearance scalars enter; no personal curve or vertex enters.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairPart {
  /** Closed choice of the part's side from the shared chart midline. */
  side: "center" | "left" | "right";

  /** Nonnegative lateral distance from that midline; a center part requires zero. */
  offsetMm: number;

  /** Positive width in millimetres of the continuous tanh separation. */
  transitionMm: number;

  /** Nonnegative relative weight of separation against the unit comb field. */
  strength: number;

  /** Positive millimetres of arc length over which part influence decays. */
  holdMm: number;

}
