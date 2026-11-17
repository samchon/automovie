import type { IAutoMovieHumanPelvisPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanPelvisPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanPelvisPoseSchema = IAutoMovieHumanPelvisPose & {
  /** Sagittal tilt: positive anterior (top of the pelvis forward), negative posterior. */
  tilt?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Frontal obliquity: positive raises the left iliac crest, negative the right. */
  obliquity?: number & tags.Minimum<-90> & tags.Maximum<90>;

  /** Transverse rotation: positive turns the front toward the person's left. */
  rotation?: number & tags.Minimum<-180> & tags.Maximum<180>;
};
