import type { IAutoMovieMotionHumanKickBall } from "../ballStrike/IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanJuggle } from "../exercise/IAutoMovieMotionHumanJuggle";
import type { IAutoMovieMotionHumanBallSport } from "../sport/IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanFieldThrow } from "../sport/IAutoMovieMotionHumanFieldThrow";
import type { IAutoMovieMotionHumanStickBall } from "../sport/IAutoMovieMotionHumanStickBall";
import type { IAutoMovieMotionHumanCatchObject } from "../throwing/IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Mechanism: Throwing, catching and kicking an object or a ball, and juggling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the ThrowCatch family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ThrowCatch laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanThrowCatch<Chain> {
  /**
   * The parameters of a throw (`IAutoMovieMotionHumanThrowObjectParams`).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.throwObject: The parameters of a throw (`IAutoMovieMotionHumanThrowObjectParams`).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.throwObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  throwObject(
    params: IAutoMovieMotionHumanThrowCatch.IThrowObject,
    anchor?: string,
  ): Chain;

  /**
   * Catching an object thrown by another action: the hands meet it where its path enters the reach, give with it, and bring it to the chest.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.catchObject: Catching an object thrown by another action: the hands meet it where its path enters the reach, give with it, and bring it to the chest.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.catchObject is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  catchObject(
    params: IAutoMovieMotionHumanThrowCatch.ICatchObject,
    anchor?: string,
  ): Chain;

  /**
   * Letting go: a hand opens on what it holds, and the held prop leaves it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.release: Letting go: a hand opens on what it holds, and the held prop leaves it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.release is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  release(
    params: IAutoMovieMotionHumanThrowCatch.IRelease,
    anchor?: string,
  ): Chain;

  /**
   * Kicking the ball prop lying beside the support foot with the instep, from standing: the kicking leg swings back, then through the ball and on.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.kickBall: Kicking the ball prop lying beside the support foot with the instep, from standing: the kicking leg swings back, then through the ball and on.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.kickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  kickBall(
    params: IAutoMovieMotionHumanThrowCatch.IKickBall,
    anchor?: string,
  ): Chain;

  /**
   * Toss juggling (#3997): the cascade, an odd number of balls each thrown from inside to the other hand and caught on the outside, and the shower, the balls travelling round, thrown high from one hand and passed low back from the other.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.juggle: Toss juggling (#3997): the cascade, an odd number of balls each thrown from inside to the other hand and caught on the outside, and the shower, the balls travelling round, thrown high from one hand and passed low back from the other.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.juggle is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  juggle(
    params: IAutoMovieMotionHumanThrowCatch.IJuggle,
    anchor?: string,
  ): Chain;

  /**
   * A field event's throw (#3872): the shot, the discus or the hammer from a throwing circle, or the javelin from the end of its runway.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.fieldThrow: A field event's throw (#3872): the shot, the discus or the hammer from a throwing circle, or the javelin from the end of its runway.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.fieldThrow is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  fieldThrow(
    params: IAutoMovieMotionHumanThrowCatch.IFieldThrow,
    anchor?: string,
  ): Chain;

  /**
   * A two-hand sports-stick action layered on the authored standing or moving support.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.stickBall: A two-hand sports-stick action layered on the authored standing or moving support.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.stickBall is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  stickBall(
    params: IAutoMovieMotionHumanThrowCatch.IStickBall,
    anchor?: string,
  ): Chain;

  /**
   * Team ball skills.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanThrowCatch.ballSport: Team ball skills.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanThrowCatch.ballSport is provided by the chain that implements IAutoMovieMotionHumanThrowCatch.
   */
  ballSport(
    params: IAutoMovieMotionHumanThrowCatch.IBallSport,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the ThrowCatch methods.
 */
export namespace IAutoMovieMotionHumanThrowCatch {
  /**
   * The parameters of `throwObject`: `IAutoMovieMotionHumanThrowObjectParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanThrowObjectParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowObjectParams` owns the shape; the alias serves `throwObject` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IThrowObject = IAutoMovieMotionHumanThrowObjectParams;

  /**
   * The parameters of `catchObject`: `IAutoMovieMotionHumanCatchObject.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCatchObject.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCatchObject.IParams` owns the shape; the alias serves `catchObject` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICatchObject = IAutoMovieMotionHumanCatchObject.IParams;

  /**
   * The parameters of `release`: `IAutoMovieMotionHumanRelease.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRelease.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRelease.IParams` owns the shape; the alias serves `release` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRelease = IAutoMovieMotionHumanRelease.IParams;

  /**
   * The parameters of `kickBall`: `IAutoMovieMotionHumanKickBall.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKickBall.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKickBall.IParams` owns the shape; the alias serves `kickBall` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKickBall = IAutoMovieMotionHumanKickBall.IParams;

  /**
   * The parameters of `juggle`: `IAutoMovieMotionHumanJuggle.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanJuggle.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanJuggle.IParams` owns the shape; the alias serves `juggle` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IJuggle = IAutoMovieMotionHumanJuggle.IParams;

  /**
   * The parameters of `fieldThrow`: `IAutoMovieMotionHumanFieldThrow.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanFieldThrow.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFieldThrow.IParams` owns the shape; the alias serves `fieldThrow` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IFieldThrow = IAutoMovieMotionHumanFieldThrow.IParams;

  /**
   * The parameters of `stickBall`: `IAutoMovieMotionHumanStickBall.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanStickBall.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStickBall.IParams` owns the shape; the alias serves `stickBall` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IStickBall = IAutoMovieMotionHumanStickBall.IParams;

  /**
   * The parameters of `ballSport`: `IAutoMovieMotionHumanBallSport.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBallSport.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBallSport.IParams` owns the shape; the alias serves `ballSport` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBallSport = IAutoMovieMotionHumanBallSport.IParams;
}
