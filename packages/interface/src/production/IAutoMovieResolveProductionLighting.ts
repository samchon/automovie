import type { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";

/**
 * Data and callback contracts shared by the ResolveProductionLighting operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The production's lights at one story-clock instant. Member documentation states the supplied records, units and absence meanings used by resolveProductionLighting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not import shot-local or edit-clock assumptions into lighting; numeric admission and active-source semantics remain the lighting resolver's responsibility.
 * @evidence contracts/development/design.md#principled-representation lighting owns production sources and storySeconds selects the instant on the story clock; source-relative tracks are resolved from that common instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveProductionLighting, used by resolveProductionLighting. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieResolveProductionLighting {
  /**
   * The production's lights at one story-clock instant.
   *
   * A production source is an ordinary light addressed by an ordinary pointer track, so it is resolved by {@link resolveShotLighting}, the code a shot's `lightMotions` runs through: sampled, checked, accumulated per light and applied the same way. A source no clip touches comes back by identity, and a clip that addresses a missing light or a property its kind does not carry throws, as it does for a shot. `inheritProductionLighting` calls it at the story moment a pinned shot's instant maps to and merges the result into the shot's staged lights.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The production's lights at one story-clock instant. Member documentation states the supplied records, units and absence meanings used by resolveProductionLighting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not import shot-local or edit-clock assumptions into lighting; numeric admission and active-source semantics remain the lighting resolver's responsibility.
   * @evidence contracts/development/design.md#principled-representation lighting owns production sources and storySeconds selects the instant on the story clock; source-relative tracks are resolved from that common instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveProductionLighting.IProps, used by resolveProductionLighting. Its lighting, storySeconds members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The production's declared sources and their story-clock motion. */
    lighting: IAutoMovieProductionLighting;

    /** The instant to evaluate, in story-clock seconds. */
    storySeconds: number;
  };
}
