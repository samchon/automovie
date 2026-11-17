import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
