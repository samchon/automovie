import type { IAutoMovieMotionHumanLieTogether } from "../floor/IAutoMovieMotionHumanLieTogether";
import type { IAutoMovieMotionHumanPullCover } from "../floor/IAutoMovieMotionHumanPullCover";
import type { IAutoMovieMotionHumanTurnOver } from "../floor/IAutoMovieMotionHumanTurnOver";

/**
 * Sleeping: over a long lie the performer turns over seeded times into
 * positions drawn by how much of the night people spend in each (Skarpsno et
 * al. 2017: side 54.1 %, back 37.5 %, front 7.3 %, the side split evenly),
 * never the one it lies in, holding still between; it pulls a cover over and
 * lies together with a partner. De Koninck et al. 1992 count such shifts
 * through the night; a film sleep compresses them into its seconds.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanSleep` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanSleep<Chain> {
  /**
   * Sleep with seeded position changes: the lying performer turns over
   * `changes` times at seeded instants spread over the sleep and holds still
   * between.
   *
   * A helper, not a chain method: `AutoMovieMotionHumanSleep.sleep(chain,
   * params)` takes the chain first and returns it with the actions appended.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `duration`, `changes`, `seed` and `on` of
   *   `IAutoMovieMotionHumanSleep.ISleep`.
   * @returns The chain with the turns appended.
   */
  sleep(chain: Chain, params: IAutoMovieMotionHumanSleep.ISleep): Chain;

  /**
   * Pulling a cover over the body.
   *
   * Registered law: `registered("pullCover", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanPullCover`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pullCover(params: IAutoMovieMotionHumanPullCover, anchor?: string): Chain;

  /**
   * Lying together with a partner.
   *
   * Registered law: `registered("lieTogether", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanLieTogether`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lieTogether(params: IAutoMovieMotionHumanLieTogether, anchor?: string): Chain;
}

/** The parameter types of the Sleep methods. */
export namespace IAutoMovieMotionHumanSleep {
  /**
   * The parameters of `sleep`: a sleep's length, its position changes and their
   * seed.
   */
  export interface ISleep {
    /**
     * The whole sleep, seconds; it must leave stillness after the changes' 2 s
     * each.
     */
    duration: number;

    /**
     * How many times the sleeper changes position, a whole number of at least
     * 1.
     */
    changes: number;

    /** The seed that draws each new position and its timing. */
    seed: number;

    /** The bed or sofa surface lain on; the floor when absent. */
    on?: IAutoMovieMotionHumanTurnOver.IOn;
  }
}
