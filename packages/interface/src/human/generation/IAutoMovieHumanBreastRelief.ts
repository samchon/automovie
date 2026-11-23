import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * A breast dome and its original trunk-chart surface and phase lookup.
 *
 * The interface package owns these declarations; AutoMovieHumanBreastRelief in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A breast dome and its original trunk-chart surface and phase lookup. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBreastRelief exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBreastRelief {
  /** What the merge reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the merge reads.
   * @evidence contracts/development/design.md#principled-representation `dome`: The breast's dome. `base`: The trunk's base surface: the body point at a height and a phase. `phaseOf`: The base's phase at a lateral place on the front at the bust point's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBreastRelief.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dome`, `base`, `phaseOf`; callers supply the complete record.
   */
  export interface IInput {
    /** The breast's dome. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /**
     * The base's phase at a lateral place on the front at the bust point's height.
     */
    phaseOf: (z: number) => number;
  }
}
