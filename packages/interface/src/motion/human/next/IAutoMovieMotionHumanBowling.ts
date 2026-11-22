import type { IAutoMovieMotionHumanBowlingSlide } from "../sport/IAutoMovieMotionHumanBowlingSlide";
import type { IAutoMovieMotionHumanPrecisionDeck } from "../sport/IAutoMovieMotionHumanPrecisionDeck";

/**
 * Ten-pin bowling: the final slide of the approach and the credit of the pins a baked delivery knocks down. The delivery itself is the throw with the bowling style (`AutoMovieMotionHumanBowling.DELIVERY`, a preset of `IAutoMovieMotionHumanThrowCatch.IStylePreset`), so the behaviour adds no throw method. `slide` appends an action and returns the chain; `readPinfall` is a reader, so it returns its named result and not the chain.
 *
 * @template Chain The chain the slide returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the behaviour's two methods, what each returns and where the delivery's data is.
 * @evidence contracts/development/design.md#principled-representation One method per law or reader of bowling, each taking its own named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bowling slide and the pinfall reader, and nothing the throw or the precision deck own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader takes the deck's own records; nothing is redefined.
 */
export interface IAutoMovieMotionHumanBowling<Chain> {
  /**
   * The final glide of a one-handed ten-pin approach: the foot opposite the delivery hand slides forward under load, brakes, and the trailing foot steps up to a recovery plant.
   *
   * @param params The `distance`, `from`, `to`, `seconds` and `hand` of `IAutoMovieMotionHumanBowlingSlide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the method does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBowling.slide is provided by the runtime namespace that implements it.
   */
  slide(params: IAutoMovieMotionHumanBowling.ISlide, anchor?: string): Chain;

  /**
   * Credit the pinfall of a baked bowling delivery: the pins down at the end of its cache, in rack order. A pin is down when its axis leans past its tip-over angle, where its centre of mass passes over the rim of its base (USBC counts a pin knocked down or off the deck).
   *
   * @param params The `pins` and the baked `result`.
   * @returns The ids of the pins down at the cache end.
   * @throws {RangeError} When a pin has no hull base below its centre of mass, or is missing from the cache.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the method does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBowling.readPinfall is provided by the runtime namespace that implements it.
   */
  readPinfall(
    params: IAutoMovieMotionHumanBowling.IReadPinfall,
  ): IAutoMovieMotionHumanBowling.IPinfall;
}

/**
 * The parameter and result types of the bowling methods.
 */
export namespace IAutoMovieMotionHumanBowling {
  /**
   * The parameters of `slide`: `IAutoMovieMotionHumanBowlingSlide.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBowlingSlide.IParams`: the units, clocks and invariants are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBowlingSlide.IParams` owns the shape; the alias serves `slide` of this behaviour without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISlide = IAutoMovieMotionHumanBowlingSlide.IParams;

  /**
   * The parameters of `readPinfall`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what the reader takes from the deck.
   * @evidence contracts/development/design.md#principled-representation The placed pins and the baked deck, both the precision deck's own records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the pinfall credit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pins and the result are the deck's records, not copies.
   */
  export interface IReadPinfall {
    /** The placed pins, each upright on its base with +Y along its axis. */
    pins: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

    /** The baked deck whose cache holds the pins. */
    result: IAutoMovieMotionHumanPrecisionDeck.IResult;
  }

  /**
   * The ids of the pins down at the cache end, in rack order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the ids name and their order.
   * @evidence contracts/development/design.md#principled-representation An array of the pins' own ids, the identity every other record of a pin uses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The result of `readPinfall` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The array carries ids only; no score or frame is inferred.
   */
  export type IPinfall = string[];
}
