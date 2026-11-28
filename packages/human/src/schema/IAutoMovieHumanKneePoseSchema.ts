import type { IAutoMovieHumanKneePose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Knee flexion and tibial rotation in degrees from neutral. Positive flexion
 * bends the knee and positive rotation turns the tibia externally. Clamped
 * evaluation applies a smaller rotation interval until 90 degrees of flexion.
 */
export type IAutoMovieHumanKneePoseSchema = IAutoMovieHumanKneePose & {
  /** Flexion 139.8, hyperextension 1.3 (measured). */
  flexion?: number & tags.Minimum<-1.3> & tags.Maximum<139.8>;

  /**
   * Tibial rotation in degrees, positive external. Clamped evaluation multiplies the nominal interval by flexion divided by 90, bounded to [0, 1].
   */
  rotation?: number & tags.Minimum<-25> & tags.Maximum<35>;
};
