import type { IAutoMovieMotionHumanLieTogether } from "../floor/IAutoMovieMotionHumanLieTogether";
import type { IAutoMovieMotionHumanPullCover } from "../floor/IAutoMovieMotionHumanPullCover";
import type { IAutoMovieMotionHumanTurnOver } from "../floor/IAutoMovieMotionHumanTurnOver";

/**
 * Sleeping: over a long lie the performer turns over seeded times into positions drawn by how much of the night people spend in each (Skarpsno et al. 2017: side 54.1 %, back 37.5 %, front 7.3 %, the side split evenly), never the one it lies in, holding still between; it pulls a cover over and lies together with a partner. De Koninck et al. 1992 count such shifts through the night; a film sleep compresses them into its seconds.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and its sources.
 * @evidence contracts/development/design.md#principled-representation One method per law or helper of the Sleep behaviour, each taking one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Sleep methods and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turns are the turn-over law's; nothing is posed here.
 */
export interface IAutoMovieMotionHumanSleep<Chain> {
  /**
   * Sleep with seeded position changes (#3987): the lying performer turns over `changes` times at seeded instants spread over the sleep and holds still between.
   *
   * @param params The `duration`, `changes`, `seed` and `on` of `IAutoMovieMotionHumanSleep.ISleep`.
   * @returns The chain with the turns appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSleep.sleep is provided by the chain that implements IAutoMovieMotionHumanSleep.
   */
  sleep(params: IAutoMovieMotionHumanSleep.ISleep): Chain;

  /**
   * Pulling a cover over the body.
   *
   * @param params The members of `IAutoMovieMotionHumanPullCover`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSleep.pullCover is provided by the chain that implements IAutoMovieMotionHumanSleep.
   */
  pullCover(params: IAutoMovieMotionHumanPullCover, anchor?: string): Chain;

  /**
   * Lying together with a partner.
   *
   * @param params The members of `IAutoMovieMotionHumanLieTogether`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSleep.lieTogether is provided by the chain that implements IAutoMovieMotionHumanSleep.
   */
  lieTogether(params: IAutoMovieMotionHumanLieTogether, anchor?: string): Chain;
}

/**
 * The parameter types of the Sleep methods.
 */
export namespace IAutoMovieMotionHumanSleep {
  /**
   * The parameters of `sleep`: a sleep's length, its position changes and their seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, units and default.
   * @evidence contracts/development/design.md#principled-representation The whole length, the count of turns, the seed and the support.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `sleep` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The seed makes the draw reproducible; nothing is random.
   */
  export interface ISleep {
    /** The whole sleep, seconds; it must leave stillness after the changes' 2 s each. */
    duration: number;

    /** How many times the sleeper changes position, a whole number of at least 1. */
    changes: number;

    /** The seed that draws each new position and its timing. */
    seed: number;

    /** The bed or sofa surface lain on; the floor when absent. */
    on?: IAutoMovieMotionHumanTurnOver.IOn;
  }
}
