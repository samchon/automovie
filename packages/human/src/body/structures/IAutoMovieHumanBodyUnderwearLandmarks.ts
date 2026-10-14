import type { IAutoMovieHumanBodyPairedLandmarks } from "./IAutoMovieHumanBodyPairedLandmarks";

/**
 * The joint landmark ids the underwear's rules are measured on.
 *
 * @evidence contracts/common.md#principled-implementation Named trunk landmarks and explicit paired hips and knees place garment rules in the shaped body frame.
 * @evidence contracts/common.md#clear-and-simple-design The mapping separates landmark identity from each style's fractional dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Landmark names resolve against the supplied basis and are not stored coordinate corrections.
 * @evidence contracts/common.md#meaningful-documentation Members state the garment boundary each landmark anchors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment landmark bindings declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment landmark bindings declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment landmark bindings type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearLandmarks {
  /** The pelvis, the waistband's lower end. */
  pelvis: string;

  /** The lumbar landmark, the waistband's upper end. */
  lumbar: string;

  /** The lower chest, the bra band's lower end. */
  lowerChest: string;

  /** The clavicle, the bra's upper front end and the strap's inner end. */
  clavicle: string;

  /** The shoulder, the strap's outer end. */
  shoulder: string;

  /** The hip joints. */
  hips: IAutoMovieHumanBodyPairedLandmarks;

  /** The knees. */
  knees: IAutoMovieHumanBodyPairedLandmarks;
}
