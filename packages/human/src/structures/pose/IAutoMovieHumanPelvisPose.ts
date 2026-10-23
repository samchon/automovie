import { tags } from "typia";

/**
 * Pelvis orientation from upright standing, degrees. The pelvis is the root, so these turn the whole body; they are not joint ranges (the hips limit the pelvis only relative to the thighs), and the bounds are a convention.
 */
export interface IAutoMovieHumanPelvisPose {
  /** Sagittal tilt: positive anterior (top of the pelvis forward), negative posterior. */
  tilt?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Frontal obliquity: positive raises the left iliac crest, negative the right. */
  obliquity?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Transverse rotation: positive turns the front toward the person's left. */
  rotation?: number & tags.Minimum<-180> & tags.Maximum<180>;
}
