import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Rigid placement shared by the entire upper row. The corner chord defines X;
 * the supplied upward guide is orthogonalized against it to define Y. Z=X cross
 * Y faces anteriorly. The origin is the central upper-lip reference, translated
 * once by the group's lift and recess. Corner points establish orientation,
 * never per-tooth positions or scaling. All points and offsets use millimetres.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds the complete enamel group through oral anchors and one rigid lift/recess frame.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines a corner chord, independent upward guide and upper-lip origin for a single millimetre attachment transform.
 */
export interface IPortraitDentalAttachment {
  /** Anatomical right oral corner in head millimetres. */
  rightCorner: IAutoMovieVector3;
  /** Anatomical left oral corner; its chord from the right defines local +X. */
  leftCorner: IAutoMovieVector3;
  /** Upper inner-lip midpoint supplying the arch's attachment origin. */
  upperLipMiddle: IAutoMovieVector3;
  /** Finite nonzero upward guide, independent of the corner chord. */
  up: IAutoMovieVector3;
  /** Signed upward placement from the upper-lip midpoint along the group's Y axis, in mm. */
  lift: number;
  /** Signed posterior placement from the upper-lip midpoint, in mm. */
  recess: number;
}
