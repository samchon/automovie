import type { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";

/**
 * Data and callback contracts shared by the ResolveProductionLighting
 * operations.
 */
export namespace IAutoMovieResolveProductionLighting {
  /**
   * The production's lights at one story-clock instant.
   *
   * A production source is an ordinary light addressed by an ordinary pointer
   * track, so it is resolved by {@link resolveShotLighting}, the code a shot's
   * `lightMotions` runs through: sampled, checked, accumulated per light and
   * applied the same way. A source no clip touches comes back by identity, and
   * a clip that addresses a missing light or a property its kind does not carry
   * throws, as it does for a shot. `inheritProductionLighting` calls it at the
   * story moment a pinned shot's instant maps to and merges the result into the
   * shot's staged lights.
   */
  export type IProps = {
    /** The production's declared sources and their story-clock motion. */
    lighting: IAutoMovieProductionLighting;

    /** The instant to evaluate, in story-clock seconds. */
    storySeconds: number;
  };
}
