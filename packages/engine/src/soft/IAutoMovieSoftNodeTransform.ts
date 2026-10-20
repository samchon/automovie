import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One evaluated node's rigid world frame supplied in a wearable soft snapshot.
 *
 * @evidence contracts/common.md#principled-implementation World position and orientation lift an authored node-local anchor offset into the resolved boundary at one fixed-step time.
 * @evidence contracts/common.md#clear-and-simple-design The wearable resolver receives only node identity and rigid placement, leaving motion sampling and scene ownership to its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No scale or missing-node default changes the rigid anchor contract; the resolver refuses an absent named frame.
 * @evidence contracts/common.md#meaningful-documentation States node identity, world frame and fixed-step provenance for both placement fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This frame record executes no animation sampling or anchor transformation; consumers own those fixed-dimensional calculations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A frame describes one absolute snapshot and contains no playback cursor or cache for future steps.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Snapshot ownership covers its position/quaternion references, while the record retains no scene graph object or renderer.
 */
export interface IAutoMovieSoftNodeTransform {
  /** Stable scene-node identity. */
  node: string;

  /** World position at this fixed-step boundary. */
  worldPosition: IAutoMovieVector3;

  /** World orientation at this fixed-step boundary. */
  worldRotation: IAutoMovieQuaternion;
}
