import { tags } from "typia";

/**
 * Authorable freckle field; sizes and distribution are artistic conventions, not clinical population statistics.
 */
export interface IAutoMovieHumanFreckles {
  /** Expected sphere intersections per square centimetre of a locally planar surface, 0 to 40. Curvature and finite patches change the observed count. */
  density: number & tags.Minimum<0> & tags.Maximum<40>;

  /** Maximum spot diameter in rest-surface millimetres, 2 to 6; off-centre sphere sections are smaller. The finite atlas can soften or omit subtexel sections. */
  diameterMm: number & tags.Minimum<2> & tags.Maximum<6>;

  /** Pigment coverage from invisible (0) to full local pigment replacement (1). */
  contrast: number & tags.Minimum<0> & tags.Maximum<1>;
}
