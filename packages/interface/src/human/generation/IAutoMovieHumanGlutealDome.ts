import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/**
 * Gluteal frame, footprint reaches and projection resolved from the trunk's anatomical sites.
 *
 * The interface package owns these declarations; AutoMovieHumanGlutealDome in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gluteal frame, footprint reaches and projection resolved from the trunk's anatomical sites. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanGlutealDome exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanGlutealDome {
  /** What the dome reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the dome reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The gluteal frame. `width`: The section's half width at the buttock point, mm. `lower`: The buttock point's height over the crotch ring, mm: the footprint's lower reach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanGlutealDome.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `width`, `lower`, `upper`, `projection`; callers supply the complete record.
   */
  export interface IInput {
    /** The gluteal frame. */
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The section's half width at the buttock point, mm. */
    width: number;

    /** The buttock point's height over the crotch ring, mm: the footprint's lower reach. */
    lower: number;

    /** Iliocristale's height over the buttock point, mm: the footprint's upper reach. */
    upper: number;

    /** The buttock point's projection, mm. */
    projection: number;
  }
}
