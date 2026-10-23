import { tags } from "typia";

/** Talocrural joint, degrees (measured). */
export interface IAutoMovieHumanAnklePose {
  /** Dorsiflexion (toes up) 13.25, plantar flexion 58.35. */
  dorsiflexion?: number & tags.Minimum<-58.35> & tags.Maximum<13.25>;
}
