import type { IAutoMovieHumanBuildTraits } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Four independent normalized authoring offsets for typia validation. Zero
 * denotes the requested population reference and the sign gives the direction
 * of adiposity, muscularity, frame shape and facial proportions.
 */
export type IAutoMovieHumanBuildTraitsSchema = IAutoMovieHumanBuildTraits & {
  /** Body fat: positive is fatter, negative leaner. */
  adiposity: number & tags.Minimum<-1> & tags.Maximum<1>;

  /** Lean mass: positive is more muscular, negative less. */
  muscularity: number & tags.Minimum<-1> & tags.Maximum<1>;

  /**
   * Skeletal frame: positive is a narrower frame with longer limbs for the stature, negative a broader, shorter-limbed frame.
   */
  slimness: number & tags.Minimum<-1> & tags.Maximum<1>;

  /**
   * Facial neoteny: positive moves the face toward child-like proportions (a vault large relative to the face, larger eyes relative to the face, a shorter nose, a smaller mouth), negative toward a more mature face.
   */
  cuteness: number & tags.Minimum<-1> & tags.Maximum<1>;
};
