/**
 * A named sagittal scalp part. Position is relative to the shared growth domain's chart origin, with anatomical left at positive X. It divides a population through the existing continuous tangent field, without storing a private guide curve. Width and hold are authored styling lengths, not measured follicular anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Named side and mm offset resolve against the shared domain midline; the expander preserves an existing local bias/envelope while replacing the named tanh width, strength and arc-decay reach.
 * @evidence contracts/common.md#clear-and-simple-design Closed side choices and separate offset, transition width and hold express one sagittal field without a second private part curve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural trait admission requires zero centre offset and nonnegative lateral offsets; the field is authored styling and does not reconstruct a follicular boundary or guarantee a realised part under contact.
 * @evidence contracts/common.md#meaningful-documentation Positive X is anatomical left, widths/hold are millimetres, and hold is an arc-decay scale rather than measured endurance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no plane conversion or tangent-field evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preserved numerical bias/envelope is owned by the expander, not a cache implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No parting curve or root buffer is allocated by this schema.
 *
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
