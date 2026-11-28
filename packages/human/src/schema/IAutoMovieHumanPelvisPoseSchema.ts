import type { IAutoMovieHumanPelvisPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Pelvis orientation in clinical degrees from anatomical neutral. Positive
 * tilt tips the top forward. Positive obliquity raises the left crest.
 * Positive rotation turns the front toward the person's left.
 */
export type IAutoMovieHumanPelvisPoseSchema = IAutoMovieHumanPelvisPose & {
  /** Sagittal tilt: positive anterior (top of the pelvis forward), negative posterior. */
  tilt?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Frontal obliquity: positive raises the left iliac crest, negative the right. */
  obliquity?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Transverse rotation: positive turns the front toward the person's left. */
  rotation?: number & tags.Minimum<-180> & tags.Maximum<180>;
};
