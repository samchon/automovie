import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanOperateInsert } from "./IAutoMovieMotionHumanOperateInsert";

/**
 * Operating an articulated thing with one hand while standing: pressing a
 * button along its axis, turning a knob about its axis, pulling or pushing a
 * drawer along its slide, or swinging a hinged door by its handle.
 *
 * The goal is the hand on the thing's moving part, and the part's motion is
 * the mechanism's own: a button's face goes in along its axis, a knob turns
 * about its axis, a slider's handle travels along its axis, a leaf's handle
 * turns about its hinge line: a door's vertical line through the point it
 * names, or the prop's own hinge axis (a cock's cross pin,
 * `operateDrive.hinge`). The hand is shaped to the part (the
 * index fingertip on a button, a closed grip on a knob, a drawer handle or a
 * door handle) and laid on it by `AutoMovieMotionHumanTarget.hand`. A part
 * on an upright face is grasped with the hand along the face's normal: a
 * handle overhand, the palm on its top; a knob with that grasp rolled about
 * the axis, and the hand rolls with the knob as it turns, the forearm's
 * pronation and supination (Magermans et al. 2005, Clin Biomech 20:591, give
 * the ranges daily tasks use), the grip starting half the turn before the
 * forearm's neutral so the turn is centred in that range. A lid's knob, its
 * axis nearer the vertical than `UPRIGHT`, takes the palm from above. Each
 * part's place is a target, so it can be a
 * prop's point; the part's outward normal is its axis. A part beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
 * tips about the hips by the least pitch that keeps the wrist within `REACH`
 * of the arm's length and straightens as the part comes nearer (a drawer
 * pulled out); a part still out of reach at the lean's limit is refused,
 * since it is walked up to first.
 *
 * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
 * reaches the part by `ready` in the aimed movement time to its width
 * (McIntosh et al. 2018), waits a brief moment for the grip, moves the part
 * from `strokeStart` to `strokeEnd` at the mechanism's pace (`operate.PACE`,
 * provisional): a button's press in 0.25 s, a knob at 180 degrees a second, a
 * slider at 0.4 m/s and a door's handle at 0.6 m/s along its arc, so a door
 * opened through 90 degrees by a handle 0.8 m from the hinge takes about
 * 2.1 s; holds it until `relax`, and returns to where it hung.
 * Events: the phrase's `ready` (contact or grip closed), `strokeStart`,
 * `stroke`, `strokeEnd` (bottom out, travel end, swing end) and `relax`
 * (release).
 *
 * On a prop that articulates (`IAutoMovieMotionHumanProp.articulate`), the operated
 * contact names the articulation it is or rides, the amount is that
 * articulation's travel in its own unit and sign, the hand follows the
 * contact of the prop posed at the travel the stroke has reached, and the
 * plan drives the articulation by the same function (`operateDrive`,
 * `IAutoMovieMotionHumanActionPlan.drives`), so the door stays open after the hand lets go
 * and the hand cannot drift off the handle. The `insert` mechanism moves a
 * held prop's working point along a socket's axis instead
 * (`operateInsert`).
 *
 * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in
 * the interface, which the core owns, so the mechanism is stated here; the
 * body stepping round a door and walking through it; two-handed or power
 * grips; pouring from a held container about its lip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: The hand; `right` when absent. travel: How far it goes in, metres; 0.005 when absent. turn: How far it turns, degrees; positive clockwise as the hand sees it.
 * @evidence contracts/development/design.md#principled-representation hand: The hand; `right` when absent. travel: How far it goes in, metres; 0.005 when absent. turn: How far it turns, degrees; positive clockwise as the hand sees it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateDrive.ts (operateDrive.part, kind); affordance/operateState.ts (operateState.at, mechanism); affordance/operate.ts (operate.plan, context); chain/HumanChainManual.ts (HumanChainManual.operate, params); affordance/operate.ts (operate.WIDTH); affordance/operate.ts (operate.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner, IAutoMovieMotionTarget, IAutoMovieMotionHumanOperateInsert.IMechanism identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanOperate {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The mechanism, the hand and the manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** What is operated. */
    mechanism: IAutoMovieMotionHumanOperate.Mechanism;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * An articulated part and how it moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and sign.
   * @evidence contracts/development/design.md#principled-representation The four one-degree-of-freedom mechanisms of household hardware.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union read by `plan` and `state`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's place is a target with a normal; amounts are the mechanism's own.
   */
  export type Mechanism =
    | {
        /** A push button or switch pressed along its axis. */
        kind: "button";
        /** The button's face, its normal pointing out. */
        at: IAutoMovieMotionTarget;
        /** How far it goes in, metres; 0.005 when absent. */
        travel?: number;
      }
    | {
        /** A knob, lid, tap or dial turned about its axis. */
        kind: "knob";
        /** The knob's centre, its normal along the axis toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it turns, degrees; positive clockwise as the hand sees it. */
        turn: number;
      }
    | {
        /** A drawer or slider moved along its axis. */
        kind: "slider";
        /** The handle, its normal along the slide toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it travels, metres; positive pulls toward the hand. */
        travel: number;
      }
    | {
        /** A leaf swung about its hinge line by its handle: a door, a lid, a gun's cock. */
        kind: "hinge";
        /** The handle, its normal out of the leaf toward the hand. */
        at: IAutoMovieMotionTarget;
        /**
         * A point on a vertical hinge line, a door's. Absent, the line is the
         * operated prop's own hinge articulation (`IAutoMovieMotionHumanOperateDrive.IPart.line`):
         * its point and its `+Y` axis, however it lies, a cock's cross pin.
         */
        hinge?: IAutoMovieMotionTarget;
        /** How far the leaf swings, degrees; positive pulls it toward the hand. */
        swing: number;
      }
    | IAutoMovieMotionHumanOperateInsert.IMechanism;
}
