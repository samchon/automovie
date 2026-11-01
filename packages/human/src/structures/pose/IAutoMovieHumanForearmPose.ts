import { tags } from "typia";

/**
 * Forearm rotation from the mid position, degrees (measured). At neutral the
 * arms hang at the sides with the thumbs forward, so 0 is thumbs forward and
 * not palms forward; full supination turns the palms forward.
 */
export interface IAutoMovieHumanForearmPose {
  /** Pronation (palm turned down) 79.45, supination 87.8. */
  pronation?: number & tags.Minimum<-87.8> & tags.Maximum<79.45>;
}
