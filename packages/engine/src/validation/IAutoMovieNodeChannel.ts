import { IAutoMovieChannel } from "@automovie/interface";

/**
 * The existing node-target arm of IAutoMovieChannel.
 *
 * @evidence contracts/development/design.md#principled-representation Extract selects kind=node from the canonical channel union, retaining its node id and translation/rotation/scale/weights path rather than inventing a parallel channel schema.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Channel admission and width lookup share the same canonical path type while pointer channels remain a separate union arm.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This compile-time selection does not admit stored JSON, resolve node references or establish the morph-target-dependent weights width.
 * @evidence contracts/development/common.md#meaningful-documentation Names the source union and discriminator; NODE_CHANNEL_PATHS and artifact gates supply runtime path admission.
 */
export type IAutoMovieNodeChannel = Extract<
  IAutoMovieChannel,
  { kind: "node" }
>;
