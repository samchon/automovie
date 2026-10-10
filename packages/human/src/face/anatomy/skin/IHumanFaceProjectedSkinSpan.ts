/**
 * One affine projected piece on an actual native skin feature.
 * Endpoints delimit the represented curve, not a chord across different
 * nearest sheets. Constant projection pieces carry zero arc length.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinSpan {
  /** First projected head-frame point, metres. */
  start: readonly number[];

  /** Last projected head-frame point, metres. */
  end: readonly number[];

  /** Arc length of this straight, source-supported piece, metres. */
  lengthMetres: number;

  /** Arc length preceding this piece, metres. */
  precedingLengthMetres: number;
}
