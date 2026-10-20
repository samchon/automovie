import { tags } from "typia";

/**
 * Build as four independent offsets, each zero at the population mean.
 *
 * Adiposity and muscularity stay separate because body mass index mixes fat and lean mass: a muscular person and a fat person of equal index differ in where volume sits and in muscle relief.
 */
export interface IAutoMovieHumanBuildTraits {
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
}
