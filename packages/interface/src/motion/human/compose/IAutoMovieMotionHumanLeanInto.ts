import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * The lean of a standing body into a hand's work that lies beyond its
 * standing arm: the trunk tips about the hips by the least pitch that keeps
 * the wrist within a share of the arm's length, the hips moving back by the
 * balance shift of that pitch so the centre of mass stays over the feet
 * where it stood, and straightens as the work comes nearer.
 *
 * A person wiping the far side of a counter or pulling a drawer does not
 * lock the elbow: the trunk inclines as far as the hand needs and no
 * further. Work still out of reach at the lean's limit
 * (`AutoMovieMotionHumanReach.LEAN_LIMIT`) is refused, since it is walked up
 * to first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres. arm: The working arm's goal on a posture at the stroke's start, so the balance weighs the arm where it reaches; the arm as the posture holds it when absent.
 * @evidence contracts/development/design.md#principled-representation share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres. arm: The working arm's goal on a posture at the stroke's start, so the balance weighs the arm where it reaches; the arm as the posture holds it when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLeanInto.ts (AutoMovieMotionHumanLeanInto.solve, return); compose/AutoMovieMotionHumanLeanInto.ts (AutoMovieMotionHumanLeanInto.solve, props); affordance/operate.ts (operate.plan); compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve); tasks/wipe.ts (wipe.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, AutoMovieHumanSide, IAutoMovieVector3, IAutoMovieHumanLimbGoal, IAutoMovieMotionClock identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLeanInto {
  /**
   * What a lean is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The body, the posture it stands in, the arm, the share of its length kept, the wrist's goal and the arm's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `solve`; the arm's goal is optional because a caller with only a wrist point has no arm to weigh.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The refusal's words are the caller's, which knows what is out of reach.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the body stands in before it leans. */
    standing: IAutoMovieMotionHumanPosture;

    /** Whether the hips move back by the balance shift of the lean (`IAutoMovieMotionHumanPhysics.balance`); absent or false, the trunk tips about the hips where they stand and no centre of mass is computed. */
    balance?: boolean;

    /** The working hand. */
    side: AutoMovieHumanSide;

    /** The share of the arm's length (upper arm and forearm) the wrist is kept within. */
    share: number;

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the original posture/stroke-progress inputs and returned world-metre wrist goal without replacing a caller's progress-to-time policy.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieVector3;

    /**
     * The working arm's goal on a posture at the stroke's start, so the
     * balance weighs the arm where it reaches; the arm as the posture holds
     * it when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the goal returned, why the balance reads it and the default.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    arm?: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a lean of `limit` degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two arguments, the metres out of reach and the lean limit in degrees, and that the returned message is the refusal's words.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    refuse: (beyond: number, limit: number) => string;
  }

  /**
   * A solved lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it returns and its unit.
   * @evidence contracts/development/design.md#principled-representation The pitch and the posture it gives, the two things a law reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pitch is read on the posture given, so a moved root is followed.
   */
  export interface ILean {
    /**
     * The least pitch in degrees that reaches at a progress; throws the refusal when the limit does not. Optional same-person FK is borrowed only by this synchronous observation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the original posture/progress inputs, optional same-person FK borrowed only through this pitch call, returned degrees and original out-of-reach refusal.
     * @evidence contracts/development/implementation.md#principled-implementation solve's implementation retains the original balanced five-degree first-reaching scan and hundredth-degree bisection, measuring each actual tipped shoulder against the unchanged wrist goal.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrist observation and query-local FK getter feed every original beyond check, scan and bisection through the prepared raw root-demand owner.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original samples, strict reach comparisons, balance-shift interpolation, smallest-shortfall refusal and target coordinates remain; no pitch/root result is cached.
     * @evidence contracts/development/implementation.md#efficient-algorithms Each pitch query retains its original bounded scan/bisection but admits only the actual shoulder ancestry; one exact FK getter shares unchanged prerequisites across those actual poses. Speedup is unmeasured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body/limb name metadata belongs to the plan, while each synchronous call alone owns or borrows its exact reader; current posture and wrist remain actual and no result crosses calls.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local getter releases on return or throw; only the numeric pitch escapes, and no workspace, target, candidate or query history enters the retained lean.
     */
    pitch: (posture: IAutoMovieMotionHumanPosture, progress: number,
      resolution?: IAutoMoviePoseResolution.ISource) => number;

    /**
     * A posture tipped by a pitch in degrees, the hips shifted back to balance it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the posture and the pitch in degrees taken and the tipped posture returned with the hips shifted back to balance it.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    tip: (
      posture: IAutoMovieMotionHumanPosture,
      pitch: number,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * The primitive that leans in by `ready`, follows the stroke's progress and straightens from `relax`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the clock it is built on and the primitive returned: leaning in by ready, following the stroke and straightening from relax.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    primitive: (clock: IAutoMovieMotionClock) => IAutoMovieMotionHumanPrimitive;
  }
}
