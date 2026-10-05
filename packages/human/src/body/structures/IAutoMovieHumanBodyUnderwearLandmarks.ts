import type { IAutoMovieHumanBodyPairedLandmarks } from "./IAutoMovieHumanBodyPairedLandmarks";

/**
 * The joint landmark ids the underwear's rules are measured on.
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
