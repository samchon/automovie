import type { IHumanFaceHairSampledRoot } from "./IHumanFaceHairSampledRoot";

/**
 * Sampled source roots and the observed accepted share of the neutral domain.
 *
 * @evidence contracts/common.md#principled-implementation Accepted source roots retain barycentric identity while share is accepted roots divided by visited neutral candidates; zero candidates use the sampler's explicit value one, and no current-shape area integration is performed.
 * @evidence contracts/common.md#clear-and-simple-design The root list and observed share travel together because density fallback needs both population and sampling-measure context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The neutral-share approximation is disclosed instead of silently claiming current-shape area accuracy or inserting authored root vertices.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish sampled identity from personal controls and explicitly limit share to neutral acceptance measure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The population type runs no Halton or area-CDF algorithm; createHumanFaceHairRoots owns candidate generation and rejection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Root sequence and original references allow retained sampling identity, but the result itself owns no cache of populations for changed masks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Accepted root count drives retained point/reference bytes and the owning layer controls how long the result remains reachable.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootPopulation {
  /** Roots retain sequence and original barycentric reference, not personal authored vertices. */
  roots: IHumanFaceHairSampledRoot[];

  /** Accepted roots divided by visited candidates in the neutral sampling measure; one when none were visited, not current-shape area integration. */
  share: number;
}
