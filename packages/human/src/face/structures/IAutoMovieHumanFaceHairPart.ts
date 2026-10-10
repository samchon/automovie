/**
 * A named sagittal scalp part. Position is relative to the shared growth domain's chart origin, with anatomical left at positive X. It divides a population through the existing continuous tangent field, without storing a private guide curve. Width and hold are authored styling lengths, not measured follicular anatomy.
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
