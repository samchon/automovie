import {
  IAutoMovieChannelLimit,
  IAutoMovieClip,
  IAutoMovieDriver,
  IAutoMovieNode,
} from "@automovie/interface";

import { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";
import { IAutoMovieResolveSprings } from "./IAutoMovieResolveSprings";

/**
 * Everything needed to resolve one instant of a scene.
 *
 * @author Samchon
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
   * Profiles applied to this scene ({@link bindProfile} per entry). Their bound
   * limits and drivers merge **before** the directly-passed `limits`/`drivers`:
   * a profile is the rig's standard baseline, the direct inputs are the
   * caller's per-scene word, so a direct limit clamps last (its bound is the
   * final one) and direct world-space drivers apply after profile-bound ones.
   * Omit for none; absent, behavior is byte-identical to before profiles
   * existed.
   */
  profiles?: IAutoMovieProfileApplication[];

  /** The instant to resolve, in clip-local seconds. */
  seconds: number;
}
