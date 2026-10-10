import type { IAutoMovieHumanFaceBasisEyeGaze } from "./IAutoMovieHumanFaceBasisEyeGaze";

/**
 * One articulated globe: its attachment owner, its rotation centre landmark
 * and its gaze channels.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisEye {
  /** Attachment owner name, `leftEye` or `rightEye`. */
  id: string;

  /** Landmark id of the globe's rotation centre. */
  center: string;

  /**
   * Gaze channels; each rotates about `axis` by `degrees * weight` and
   * translates the globe by `translation * weight`, the small eccentric
   * shift the source authored with its lids (the ocular literature
   * reports a varying, eccentric centre of rotation; the preparation
   * records each channel's figure and bounds it).
   */
  gaze: IAutoMovieHumanFaceBasisEyeGaze[];
}
