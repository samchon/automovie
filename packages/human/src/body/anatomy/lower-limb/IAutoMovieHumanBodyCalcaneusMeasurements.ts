import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One calcaneus supporting the heel beneath the talus.
 *
 * Heel projection and plantar contact cannot be reconstructed from this bone volume alone; the subtalar facet, plantar fat pad and skin remain separate.
 *
 * @evidence contracts/common.md#principled-implementation Required calcaneal bone volume retains its anatomical quantity/provenance while excluding talus and plantar fat-pad ownership.
 * @evidence contracts/common.md#clear-and-simple-design One heel-bone record owns its quantity without duplicating subtalar/soft-tissue components.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bone volume alone cannot reconstruct heel projection, contact or plantar tissue.
 * @evidence contracts/common.md#meaningful-documentation The prose names heel-bone scope and the separate facet/fat-pad/skin limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Calcaneal volume typing executes no heel-surface reconstruction or integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One heel-bone record retains no shared plantar-contact calculation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Calcaneus metadata owns no segmented bone bytes or heel mesh resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCalcaneusMeasurements {
  /** Calcaneal bone volume alone, excluding talus and heel fat pad. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
