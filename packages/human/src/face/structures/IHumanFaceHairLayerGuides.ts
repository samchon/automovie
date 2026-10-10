/**
 * Numerical guide hierarchy of a connected hair population.
 * Guides and interpolated locks share native root identities and the part side.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerGuides {
  /** Fraction of roots integrated as guides, in (0,1]. */
  fraction: number;

  /** Nearest same-side guide population, integral in [1,8]. */
  neighbours: number;

  /** Optional tip attraction toward the nearest guide, in [0,1]. */
  clump?: number;
}
