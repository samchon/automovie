import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One posed upper/lower midline vertex pair and its signed aperture.
 *
 * @evidence contracts/common.md#principled-implementation The producer poses the registered upper/lower native vertices and reads their signed separation along canonical opening up.
 * @evidence contracts/common.md#clear-and-simple-design Both points accompany their scalar gap so closure and passage diagnostics retain the actual pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive/zero/negative projection has model-frame meaning; it supplies no clinical opening capacity or whole-surface contact certificate.
 * @evidence contracts/common.md#meaningful-documentation Members identify posed coordinates and upper-minus-lower sign; points and gap use head-frame metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no pose/projection; measureHumanFaceAperture owns the operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no work; readers consume one measured pair.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; returned vectors remain caller-owned.
 *
 * @author Samchon
 */
export interface IHumanFaceAperturePair {
  /** Posed upper vertex. */
  upper: IAutoMovieVector3;

  /** Posed lower vertex. */
  lower: IAutoMovieVector3;

  /** Upper minus lower along opening up, in metres; positive is open, zero projected contact. */
  gap: number;
}
