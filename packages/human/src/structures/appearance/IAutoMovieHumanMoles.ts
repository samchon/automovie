import { tags } from "typia";

/**
 * Authorable melanocytic nevi (moles and beauty marks) over the whole skin; counts and sizes are artistic conventions, not clinical population statistics.
 */
export interface IAutoMovieHumanMoles {
  /** Expected number of marks over the whole body, 0 to 200; palms, soles and lips take none. */
  count: number & tags.Minimum<0> & tags.Maximum<200>;

  /** Largest mark diameter in rest-surface millimetres, 1 to 6; diameters spread down to a third of it. */
  diameterMm: number & tags.Minimum<1> & tags.Maximum<6>;

  /** Pigment coverage from invisible (0) to a dark brown mark (1). */
  contrast: number & tags.Minimum<0> & tags.Maximum<1>;
}
