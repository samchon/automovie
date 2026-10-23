import { tags } from "typia";

/**
 * Authorable freckle field; sizes and distribution are artistic conventions, not clinical population statistics.
 */
export interface IAutoMovieHumanFreckles {
  /** Expected marks per square centimetre of rest surface where freckling is strongest (face, shoulders, upper chest and back), 0 to 40; less exposed skin takes a fraction of it. */
  density: number & tags.Minimum<0> & tags.Maximum<40>;

  /** Largest spot diameter in rest-surface millimetres, 2 to 6; diameters spread down to a third of it, and the finite mark image softens spots near its texel size. */
  diameterMm: number & tags.Minimum<2> & tags.Maximum<6>;

  /** Pigment coverage from invisible (0) to full local pigment replacement (1). */
  contrast: number & tags.Minimum<0> & tags.Maximum<1>;
}
