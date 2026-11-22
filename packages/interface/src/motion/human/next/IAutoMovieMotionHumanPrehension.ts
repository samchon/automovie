import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanCarryHang } from "../handling/IAutoMovieMotionHumanCarryHang";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanRegrasp } from "../handling/IAutoMovieMotionHumanRegrasp";

/**
 * Taking, holding and releasing an object by hand: the grasp, the carry pose and the regrasp. pickUp and putDown share one reach model (`HumanPrehension`).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Prehension family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Prehension laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanPrehension<Chain> {
  /**
   * Reaching for a prop's grip, grasping it and lifting it clear.
   *
   * @param params The `prop`, `handle`, `hand`, `lift` and `use` of `IAutoMovieMotionHumanPickUp.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  pickUp(
    params: IAutoMovieMotionHumanPrehension.IPickUp,
    anchor?: string,
  ): Chain;

  /**
   * Setting a held prop down at a place and letting go.
   *
   * @param params The `prop`, `at`, `on`, `onto`, `yaw`, `rotation` and `hand` of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  putDown(
    params: IAutoMovieMotionHumanPrehension.IPutDown,
    anchor?: string,
  ): Chain;

  /**
   * A held object moved within or with the hand that holds it, without being put down: turned about one of its own axes (a key in a lock, a cap), shifted to another of its grips (a pen turned into a writing grip, a phone from a carry grip to a texting grip), or rolled across the fingers (a coin).
   *
   * @param params The `kind`, `prop`, `side`, `axis`, `angle` and `to` of `IAutoMovieMotionHumanRegrasp.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  regrasp(
    params: IAutoMovieMotionHumanPrehension.IRegrasp,
    anchor?: string,
  ): Chain;

  /**
   * Loads carried at the sides with the arms hanging, performed over a walk (`HumanChain.over`): a farmer's walk.
   *
   * @param params The `left`, `right` and `seconds` of `IAutoMovieMotionHumanCarryHang.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  carryHang(
    params: IAutoMovieMotionHumanPrehension.ICarryHang,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Prehension methods.
 */
export namespace IAutoMovieMotionHumanPrehension {
  /**
   * The parameters of `pickUp`: `IAutoMovieMotionHumanPickUp.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPickUp.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the shape; the alias serves `pickUp` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPickUp = IAutoMovieMotionHumanPickUp.IParams;

  /**
   * The parameters of `putDown`: `IAutoMovieMotionHumanPutDown.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPutDown.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPutDown.IParams` owns the shape; the alias serves `putDown` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPutDown = IAutoMovieMotionHumanPutDown.IParams;

  /**
   * The parameters of `regrasp`: `IAutoMovieMotionHumanRegrasp.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRegrasp.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRegrasp.IParams` owns the shape; the alias serves `regrasp` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRegrasp = IAutoMovieMotionHumanRegrasp.IParams;

  /**
   * The parameters of `carryHang`: `IAutoMovieMotionHumanCarryHang.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCarryHang.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarryHang.IParams` owns the shape; the alias serves `carryHang` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICarryHang = IAutoMovieMotionHumanCarryHang.IParams;
}

/**
 * Reach to grasp as two coupled components, the model of prehension since
 * Jeannerod (1981, 1984): the transport carries the hand to the object and
 * the grasp shapes the hand, opening it to a peak aperture during the
 * transport and closing it on the object as the transport ends. Every number
 * here belongs to the reaching and grasping family; none is borrowed from
 * striking or locomotion.
 *
 * - Movement time. McIntosh, Mon-Williams and Tresilian (2018, J. Exp.
 *   Psychol. Hum. Percept. Perform. 44:1022, table 1) found reach-to-grasp
 *   time poorly fitted by Fitts' law and well fitted by a two-factor model,
 *   `MT = a + b lg A + c W` for the grasped width, with the group fit
 *   a = -306.07 ms, b = 297.27 ms per decade of amplitude A in millimetres and
 *   c = 0.65 ms per millimetre of width W (r^2 = 0.97). Amplitudes below the
 *   study's shortest (170 mm) take its value, since the fit is not valid
 *   there; skill varies the duration through the cross-task timing
 *   variability (`HumanSkill.jitter`), no study of reaching speed by
 *   proficiency having been located.
 * - Peak aperture. It scales with the object's width with a slope of about
 *   0.8 (Smeets and Brenner 1999, Motor Control 3:237, as cited by Utz et al.
 *   2015); the intercept, 25 mm, is provisional (the full regression was not
 *   reachable): it keeps the peak 5 mm above the widest graspable object,
 *   about 100 mm (McIntosh et al. 2018's hypothetical maximum grip).
 * - Peak timing. Aperture peaks at 60 to 70 % of the transport (Jeannerod
 *   1984, J. Mot. Behav. 16:235); a seeded draw places it inside that band.
 *
 * The transport path superposes two minimum-jerk units (Flash and Hogan
 * 1985; Flash and Henis 1991): the first carries the wrist from where it is to
 * an approach point set back from the grasp along the object's approach axis,
 * the second, overlapping its end, carries it the last stretch along that axis
 * onto the grasp, so the hand arrives moving along the approach and never
 * through the object, as the deceleration phase of a reach to grasp is the
 * longer one (McIntosh 2018, time after peak speed). Both units end at rest,
 * so the wrist stops exactly on the grasp with zero velocity and acceleration.
 * The hand turns to its grasp rotation on a minimum-jerk slerp finished by
 * the second unit's start, so it is oriented before the final approach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.
 * @evidence contracts/development/design.md#principled-representation duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanPrehension.ts (HumanPrehension.transport, return); handling/HumanPrehension.ts (HumanPrehension.transport, rotation); handling/handOver.ts (handOver.plan); handling/handshake.ts (handshake.plan); handling/pickUp.ts (pickUp.plan); handling/putDown.ts (putDown.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPrehension {
  /**
   * A planned transport of the wrist and the hand's turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanPrehension.ts (HumanPrehension.transport, return); handling/handOver.ts (handOver.plan); handling/handshake.ts (handshake.plan); handling/pickUp.ts (pickUp.plan); handling/putDown.ts (putDown.plan); handling/receive.ts (receive.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITransport {
    /** Seconds the transport lasts. */
    duration: number;

    /**
     * The wrist at a second of the transport (clamped to its span), metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.ITransport.wrist: The wrist at a second of the transport (clamped to its span), metres.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.ITransport.wrist is used through packages/motions/src/handling/HumanPrehension.ts.
     */
    wrist(seconds: number): IAutoMovieVector3;

    /**
     * The hand's world rotation at a second of the transport.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.ITransport.turn: The hand's world rotation at a second of the transport.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.ITransport.turn is used through packages/motions/src/handling/HumanPrehension.ts.
     */
    turn(seconds: number): IAutoMovieQuaternion;
  }

  /**
   * Plan a transport. Input rotation of HumanPrehension.transport. The hand's world rotation at the start and at the grasp.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Initial world orientation as a unit quaternion. to: Final world orientation as a unit quaternion.
   * @evidence contracts/development/design.md#principled-representation from: Initial world orientation as a unit quaternion. to: Final world orientation as a unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanPrehension.ts (HumanPrehension.transport, rotation).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ITransportRotation = {
    /** Initial world orientation as a unit quaternion. */
    from: IAutoMovieQuaternion;
    /** Final world orientation as a unit quaternion. */
    to: IAutoMovieQuaternion;
  };
}
