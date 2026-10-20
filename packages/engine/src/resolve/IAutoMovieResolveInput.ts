import {
  IAutoMovieChannelLimit,
  IAutoMovieClip,
  IAutoMovieDriver,
  IAutoMovieNode,
} from "@automovie/interface";

import { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";
import { IAutoMovieResolveSprings } from "./IAutoMovieResolveSprings";

/**
 * Borrowed inputs for one numerical scene frame, with explicit optional cross-frame spring state. Profiles bind before direct policy; the caller owns input lifetime and resets spring history when scene identity changes.
 *
 * @evidence contracts/common.md#principled-implementation Supply parent-local nodes, optional clip sequence, ordered channel limits/drivers, profile applications and explicit cross-frame spring state for one finite-time frame resolution.
 * @evidence contracts/common.md#clear-and-simple-design Inputs expose the sample, clamp, compose and world-driver responsibilities without embedding host objects or hiding stateful springs behind a pure-looking call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent clips select rest pose and absent spring state defers springs; unsupported graph/channels are refused by their owning helpers rather than silently synthesized.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish borrowed node/clip arrays, profile-before-direct policy order, seconds and in-place spring advancement.
 * @evidence contracts/performance.md#efficient-algorithms Input storage references N nodes, tracks, L limits and D drivers; resolver scans and matrix/channel allocations are owned by resolveFrame, not bounded by this wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work Profiles and scene data may be reused while contents stay equivalent; the clip/time/state combination determines new sampled and spring results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns borrowed inputs and spring maps across frames; the input declaration creates no resource handles or independent running work.
 */
export interface IAutoMovieResolveInput {
  /** The scene graph: nodes with parent-local rest transforms. */
  nodes: IAutoMovieNode[];

  /**
   * The clip(s) animating this frame, or `null` for the rest pose. A sequence
   * resolves duplicate channels by their track start time and producer order.
   */
  clip: IAutoMovieClip | readonly IAutoMovieClip[] | null;

  /** Channel limits to clamp sampled values against (generalized ROM). */
  limits: IAutoMovieChannelLimit[];

  /**
   * Drivers computing channels from other channels. Channel-space drivers
   * (`copy`, `driven`) are resolved this frame; world-space ones apply in the
   * post-compose pass; only springs without a {@link springs} input are returned
   * in {@link IAutoMovieResolveOutput.deferredDrivers}. Omit for none.
   */
  drivers?: IAutoMovieDriver[];

  /**
   * Cross-frame spring stepping (state + dt + colliders). When present every
   * spring driver advances inside this frame; when absent springs defer.
   */
  springs?: IAutoMovieResolveSprings;

  /**
   * Borrowed profile applications bind and merge before direct limits/drivers. Direct limits clamp last and direct world drivers apply afterward; omit for none.
   */
  profiles?: IAutoMovieProfileApplication[];

  /** The instant to resolve, in clip-local seconds. */
  seconds: number;
}
