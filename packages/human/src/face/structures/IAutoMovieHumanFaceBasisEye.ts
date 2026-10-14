import type { IAutoMovieHumanFaceBasisEyeGaze } from "./IAutoMovieHumanFaceBasisEyeGaze";

/**
 * One articulated globe: its attachment owner, its rotation centre landmark
 * and its gaze channels.
 *
 * @evidence contracts/common.md#principled-implementation A named attachment owner and shaped landmark centre bind ordered source-authored gaze channels to one rigid globe; the articulation reader composes rotations in list order and sums endpoint translations.
 * @evidence contracts/common.md#clear-and-simple-design Globe ownership/centre remain here and each gaze channel owns its axis, angular endpoint and accompanying translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fitted linear gaze path does not recover individual eccentric rotation physiology, and lid coupling remains source residual tissue rather than another rigid globe weight.
 * @evidence contracts/common.md#meaningful-documentation Members identify anatomical attachment owner, landmark centre and authored gaze composition with the stated eccentric-path limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no quaternion composition or globe posing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source gaze list defines no shaped-centre cache or repeated rotation result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its gaze array and registration; the type acquires no optical mesh or task.
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
