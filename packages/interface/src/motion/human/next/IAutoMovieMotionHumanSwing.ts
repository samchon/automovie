import type { IAutoMovieMotionHumanSword } from "../lexicon/IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "../lexicon/IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanBaseball } from "../sport/IAutoMovieMotionHumanBaseball";
import type { IAutoMovieMotionHumanRacket } from "../sport/IAutoMovieMotionHumanRacket";

/**
 * Swinging an implement at a ball: the bat and the racket share one cut timing model (edge peak 6 to 10 m/s by skill).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Swing family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Swing laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSwing<Chain> {
  /**
   * Baseball and softball positions without the bat's swing or the pitch (#3248): the catcher's crouch, fielding a ground ball, and the batting stance with its load.
   *
   * @param params The `kind`, `seconds` and `manner` of `IAutoMovieMotionHumanBaseball.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSwing.baseball is provided by the chain that implements IAutoMovieMotionHumanSwing.
   */
  baseball(
    params: IAutoMovieMotionHumanSwing.IBaseball,
    anchor?: string,
  ): Chain;

  /**
   * Racket-sport strokes (#3725 and #3726) and the solo ready position, split step and golf address (#3249).
   *
   * @param params The `kind`, `side`, `seconds`, `implement`, `contactAt` and `manner` of `IAutoMovieMotionHumanRacket.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSwing.racket is provided by the chain that implements IAutoMovieMotionHumanSwing.
   */
  racket(params: IAutoMovieMotionHumanSwing.IRacket, anchor?: string): Chain;
}

/**
 * The parameter types of the Swing methods.
 */
export namespace IAutoMovieMotionHumanSwing {
  /**
   * The parameters of `baseball`: `IAutoMovieMotionHumanBaseball.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBaseball.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBaseball.IParams` owns the shape; the alias serves `baseball` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBaseball = IAutoMovieMotionHumanBaseball.IParams;

  /**
   * The parameters of `racket`: `IAutoMovieMotionHumanRacket.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRacket.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRacket.IParams` owns the shape; the alias serves `racket` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRacket = IAutoMovieMotionHumanRacket.IParams;

  /**
   * How many hands hold the implement: one or two.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two grips a swing preset fixes.
   * @evidence contracts/development/design.md#principled-representation A closed union of the swing's hand counts, as `IAutoMovieMotionHumanSword.IWield.hands`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two-hand swing presets read it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per hand count, with no optional fields to combine.
   */
  export type Hands = 1 | 2;

  /**
   * A swing preset that fixes the line the cut comes from: the one-handed racket strokes (forehand, backhand drive, topspin, overhead smash, volley) and the volleyball spike. Spread into the cut's parameters; the composition gives the rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which rows read it.
   * @evidence contracts/development/design.md#principled-representation One required member, the cut's own line, so a preset fixes exactly it and the cut keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the `AutoMovieMotionHumanSwing` stroke presets are its data and the sport-swing rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the cut's parameters.
   */
  export interface IStrokePreset {
    /** The line the cut comes from. */
    from: IAutoMovieMotionHumanSword.Line;
  }

  /**
   * A swing preset that fixes the line and the grip: the baseball swing, the two-hand backhand, the golf swing and the putt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which rows read it.
   * @evidence contracts/development/design.md#principled-representation Two required members, the cut's own line and grip.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the grip presets are its data and the sport-swing rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the cut's parameters.
   */
  export interface IGripPreset extends IStrokePreset {
    /** How many hands hold the implement. */
    hands: Hands;
  }

  /**
   * A swing preset that fixes the line, the grip and the withdrawn share: the checked swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
   * @evidence contracts/development/design.md#principled-representation Three required members: the cut's line, its grip and its feint share in (0, 1).
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the check preset is its data and the checkSwing row reads it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the cut's parameters.
   */
  export interface ICheckPreset extends IGripPreset {
    /** The share of the stroke shown before it is withdrawn, in (0, 1). */
    feint: number;
  }

  /**
   * A swing preset that fixes the guard and the grip: the bunt, the bat held level before the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
   * @evidence contracts/development/design.md#principled-representation Two required members, the guard's own name and grip.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the bunt preset is its data and the bunt row reads it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the guard's parameters.
   */
  export interface IBuntPreset {
    /** The guard held. */
    guard: IAutoMovieMotionHumanSwordGuard.Guard;

    /** How many hands hold the bat. */
    hands: Hands;
  }
}
