import type { IAutoMovieMotionHumanConduct } from "../music/IAutoMovieMotionHumanConduct";
import type { IAutoMovieMotionHumanPlayWindInstrument } from "../daily/IAutoMovieMotionHumanPlayWindInstrument";

/**
 * Mechanism: Playing and conducting music: a wind instrument and the conductor's baton.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Instrument family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Instrument laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanInstrument<Chain> {
  /**
   * Playing pose of a held bugle, with the modeled mouthpiece at the lips.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.playWindInstrument: Playing pose of a held bugle, with the modeled mouthpiece at the lips.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.playWindInstrument is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  playWindInstrument(params: IAutoMovieMotionHumanInstrument.IPlayWindInstrument, anchor?: string): Chain;

  /**
   * Conducting with a held baton: its tip beats the standard figure of the meter on the beat clock, the ictus, the tip's lowest point of each beat, falling on the beat's instant.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanInstrument.conduct: Conducting with a held baton: its tip beats the standard figure of the meter on the beat clock, the ictus, the tip's lowest point of each beat, falling on the beat's instant.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanInstrument.conduct is provided by the chain that implements IAutoMovieMotionHumanInstrument.
   */
  conduct(params: IAutoMovieMotionHumanInstrument.IConduct, anchor?: string): Chain;
}

/**
 * The parameter types of the Instrument methods.
 */
export namespace IAutoMovieMotionHumanInstrument {
  /**
   * The parameters of `playWindInstrument`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `playWindInstrument`: the existing type of its law.
   */
  export type IPlayWindInstrument = IAutoMovieMotionHumanPlayWindInstrument.IParams;

  /**
   * The parameters of `conduct`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `conduct`: the existing type of its law.
   */
  export type IConduct = IAutoMovieMotionHumanConduct.IParams;
}
