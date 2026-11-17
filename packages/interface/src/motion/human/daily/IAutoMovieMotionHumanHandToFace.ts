import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanHandToFaceRows } from "./IAutoMovieMotionHumanHandToFaceRows";
import type { IAutoMovieMotionHumanHeldUse } from "../handling/IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A hand-to-face task of daily living while standing: drinking, sipping,
 * eating with a spoon, biting held food, a phone at the ear, reading a held
 * sheet, brushing the teeth, combing the hair, washing the face and wiping
 * the mouth (M14, #3234).
 *
 * Every task takes the drinking task's phases (Alt Murphy et al. 2006,
 * 2011): reach and forward transport to the face, the task at the face,
 * back transport and return. Each is a row of the touch generator
 * (`AutoMovieMotionHumanTouch`) on a region of the performer's own head:
 * the effector is the tip of the implied tool (a cup's rim, a spoon's bowl,
 * a brush's head, a phone's face) stated in the hand's axes as shares of
 * the hand's length, or a bare palm, so the task is performed with no prop
 * and the hand stands where the tool would put it. A grooming task repeats
 * its stroke at the face (rub kinds); eating brings the head forward to meet
 * the spoon (van der Kamp and Steenbergen 1999), drinking tips the head back
 * only once the vessel is at the lips, in the drinking phase that follows
 * the transport (Alt Murphy et al. 2011), reading flexes the head by
 * 35 degrees, inside the 33 to 45 degrees of Lee et al. 2015, and holds the
 * sheet 36.2 cm from the eyes (Bababekova et al. 2011, the mean for text),
 * on the line pitched down by the head's flexion and 15 degrees of the eyes
 * (provisional). Tool lengths, the head's shares and the sip's extension
 * are provisional.
 *
 * Events: the phrase instants, with `atMouth` (or `atEar`, `atFace`,
 * `atSheet`) at `ready` and `taskEnd` at `strokeEnd`. The back transport may
 * be cut into a put-down or standing from `relax`.
 *
 * With `prop`, the task is performed with the prop the hand already holds
 * (a glass a `pickUp` took): the prop's own point, a vessel's `lip` or a
 * phone's `screen`, replaces the implied tool (`HumanHeld`), the
 * fingers keep their grip, and the hand holds the prop through the task and
 * after it. A prop that is not in the hand is refused. With the `grasp` the
 * prop was taken up by for its use, the hand holds it at the face as that
 * grasp presents it there (`HumanHeldUse`), so the task asks the wrist only
 * what the grip was chosen for; with `other` as well, the other hand takes
 * the prop's other handle where the first carries it, as a camera is held
 * in both hands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The hand of a one-hand task; `right` when absent. count: Repetitions at the face; the row's when absent. seconds: Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation side: The hand of a one-hand task; `right` when absent. count: Repetitions at the face; the row's when absent. seconds: Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.handToFace, params); daily/handToFace.ts (handToFace.plan, context); daily/handToFace.ts (handToFace.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHandToFaceRows.Task, IAutoMovieMotionHumanHandToFaceRows.IRow, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanHeldUse.IGrasp, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHandToFace {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The task by name, the hand, the repetitions and the time at the face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The row supplies every default.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The task: one of the table's by name, or a row of the production's own. */
    task:
      | IAutoMovieMotionHumanHandToFaceRows.Task
      | IAutoMovieMotionHumanHandToFaceRows.IRow;

    /** The hand of a one-hand task; `right` when absent. */
    side?: IAutoMovieMotionHumanHand.Side;

    /** Repetitions at the face; the row's when absent. */
    count?: number;

    /** Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?:
      | number
      | {
          /** Lower and upper bounds for an evenly drawn hold duration at the face AFTER repetitions, seconds. */
          between: readonly [number, number];
        };

    /** The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent. */
    prop?: string;

    /** The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent. */
    point?: string;

    /**
     * With `prop`, the grasp it was taken up by for its use
     * (`IAutoMovieMotionHumanHeldUse.IGrasp`): the hand holds the prop at the face as that
     * grasp presents it at the row's region, the prop's point as the use's
     * working point, and moves only the point. The prop's point faces into
     * the region when absent.
     */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent. */
    other?: string;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }
}
