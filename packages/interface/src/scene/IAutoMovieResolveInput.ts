import type { IAutoMovieChannelLimit } from "../core/IAutoMovieChannelLimit";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieDriver } from "../core/IAutoMovieDriver";
import type { IAutoMovieNode } from "../core/IAutoMovieNode";
import type { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";
import type { IAutoMovieResolveSprings } from "./IAutoMovieResolveSprings";

/**
 * Borrowed inputs for one numerical scene frame, with explicit optional
 * cross-frame spring state. Profiles bind before direct policy; the caller owns
 * input lifetime and resets spring history when scene identity changes.
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
   * Borrowed profile applications bind and merge before direct limits/drivers.
   * Direct limits clamp last and direct world drivers apply afterward; omit for
   * none.
   */
  profiles?: IAutoMovieProfileApplication[];

  /** The instant to resolve, in clip-local seconds. */
  seconds: number;
}
