import { IAutoMovieChannel } from "@automovie/interface";
/**
 * The existing node-target arm of IAutoMovieChannel.
 *
 * @evidence contracts/common.md#principled-implementation Extract selects kind=node from the canonical channel union, retaining its node id and translation/rotation/scale/weights path rather than inventing a parallel channel schema.
 * @evidence contracts/common.md#clear-and-simple-design Channel admission and width lookup share the same canonical path type while pointer channels remain a separate union arm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This compile-time selection does not admit stored JSON, resolve node references or establish the morph-target-dependent weights width.
 * @evidence contracts/common.md#meaningful-documentation Names the source union and discriminator; NODE_CHANNEL_PATHS and artifact gates supply runtime path admission.
 * @evidence contracts/performance.md#efficient-algorithms Type selection adds no runtime traversal or per-keyframe allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the authoring channel definition directly so a new canonical node arm is not independently recopied here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The alias acquires no runtime storage, clip cursor or resource lifetime.
 * @author Samchon
 */
export type IAutoMovieNodeChannel = Extract<
  IAutoMovieChannel,
  { kind: "node" }
>;
