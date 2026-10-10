import type { IHumanFaceHairSampledRoot } from "./IHumanFaceHairSampledRoot";

/**
 * Sampled source roots and the observed accepted share of the neutral domain.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootPopulation {
  /** Roots retain sequence and original barycentric reference, not personal authored vertices. */
  roots: IHumanFaceHairSampledRoot[];

  /** Mask acceptance fraction in the neutral sampling measure; not current-shape area integration. */
  share: number;
}
