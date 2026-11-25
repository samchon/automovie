import {
  IAutoMovieLight,
  type IAutoMovieResolveProductionLighting,
} from "@automovie/interface";

import { resolveShotLighting } from "../resolve/resolveShotLighting";

/**
 * The production's lights at one story-clock instant.
 *
 * A production source is an ordinary light addressed by an ordinary pointer
 * track, so it is resolved by {@link resolveShotLighting}, the code a shot's
 * `lightMotions` runs through: sampled, checked, accumulated per light and
 * applied the same way. A source no clip touches comes back by identity, and a
 * clip that addresses a missing light or a property its kind does not carry
 * throws, as it does for a shot. `inheritProductionLighting` calls it at the
 * story moment a pinned shot's instant maps to and merges the result into the
 * shot's staged lights.
 *
 * @param props The production lighting and the instant.
 * @returns One light per declared source, in declaration order.
 */
export function resolveProductionLighting(
  props: IAutoMovieResolveProductionLighting.IProps,
): IAutoMovieLight[] {
  return resolveShotLighting({
    lights: props.lighting.lights,
    clips: props.lighting.motions,
    seconds: props.storySeconds,
  });
}
