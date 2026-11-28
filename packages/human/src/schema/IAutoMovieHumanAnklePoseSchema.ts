import type { IAutoMovieHumanAnklePose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Talocrural angle in degrees from neutral. Positive dorsiflexion lifts the
 * toes. Negative values point the foot in plantar flexion.
 */
export type IAutoMovieHumanAnklePoseSchema = IAutoMovieHumanAnklePose & {
  /** Dorsiflexion (toes up) 13.25, plantar flexion 58.35. */
  dorsiflexion?: number & tags.Minimum<-58.35> & tags.Maximum<13.25>;
};
