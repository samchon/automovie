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
     *
     * @evidence contracts/development/common.md#meaningful-documentation The base's phase at a lateral place on the front at the bust point's height.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBreastRelief and the callback provider must satisfy the documented phaseOf contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBreastRelief and its callback provider own the cost of each phaseOf invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBreastRelief and the callback provider determine when the inputs to phaseOf describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBreastRelief and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanBreastRelief.IInput.phaseOf callable contract, without an implementation body. AutoMovieHumanBreastRelief and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanBreastRelief.IInput.phaseOf declares only the invocation boundary; decomposition belongs to AutoMovieHumanBreastRelief and the callback provider.
     */
    phaseOf: (z: number) => number;
  }
}
