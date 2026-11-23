import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanTouchEffector } from "../compose/IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "../compose/IAutoMovieMotionHumanTouchForm";

/**
 * A hand-to-face task of daily living while standing: drinking, sipping, eating
 * with a spoon, biting held food, a phone at the ear, reading a held sheet,
 * brushing the teeth, combing the hair, washing the face and wiping the mouth.
 *
 * Every task takes the drinking task's phases (Alt Murphy et al. 2006, 2011):
 * reach and forward transport to the face, the task at the face, back transport
 * and return. Each is a row of the touch generator
 * (`AutoMovieMotionHumanTouch`) on a region of the performer's own head: the
 * effector is the tip of the implied tool (a cup's rim, a spoon's bowl, a
 * brush's head, a phone's face) stated in the hand's axes as shares of the
 * hand's length, or a bare palm, so the task is performed with no prop and the
 * hand stands where the tool would put it. A grooming task repeats its stroke
 * at the face (rub kinds); eating brings the head forward to meet the spoon
 * (van der Kamp and Steenbergen 1999), drinking tips the head back only once
 * the vessel is at the lips, in the drinking phase that follows the transport
 * (Alt Murphy et al. 2011), reading flexes the head by 35 degrees, inside the
 * 33 to 45 degrees of Lee et al. 2015, and holds the sheet 36.2 cm from the
 * eyes (Bababekova et al. 2011, the mean for text), on the line pitched down by
 * the head's flexion and 15 degrees of the eyes (provisional). Tool lengths,
 * the head's shares and the sip's extension are provisional.
 *
 * Events: the phrase instants, with `atMouth` (or `atEar`, `atFace`, `atSheet`)
 * at `ready` and `taskEnd` at `strokeEnd`. The back transport may be cut into a
 * put-down or standing from `relax`.
 *
 * With `prop`, the task is performed with the prop the hand already holds (a
 * glass a `pickUp` took): the prop's own point, a vessel's `lip` or a phone's
 * `screen`, replaces the implied tool (`HumanHeld`), the fingers keep their
 * grip, and the hand holds the prop through the task and after it. A prop that
 * is not in the hand is refused. With the `grasp` the prop was taken up by for
 * its use, the hand holds it at the face as that grasp presents it there
 * (`HumanHeldUse`), so the task asks the wrist only what the grip was chosen
 * for; with `other` as well, the other hand takes the prop's other handle where
 * the first carries it, as a camera is held in both hands.
 */
export namespace IAutoMovieMotionHumanHandToFaceRows {
  /** The tasks. */
  export type Task =
    | "drink"
    | "sip"
    | "eat"
    | "bite"
    | "phone"
    | "read"
    | "brushTeeth"
    | "comb"
    | "washFace"
    | "wipeMouth"
    | "pinchNose";

  /** One task's row. */
  export interface IRow {
    /**
     * The region the right hand works on; `null` for a held sheet before the
     * eyes.
     */
    region: AutoMovieHumanoidRegion | null;

    /** The region the left hand works on at the same time; one hand when absent. */
    other?: AutoMovieHumanoidRegion;

    /** The effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The movement at the face. */
    kind: IAutoMovieMotionHumanTouchForm.Kind;

    /** Repetitions when the parameters give none. */
    count: number;

    /** Seconds at the face after the repetitions when the parameters give none. */
    hold: number;

    /** The travel's direction. */
    tangent: IAutoMovieMotionHumanTouchForm.Tangent;

    /**
     * `true` when the held tool stands on the world's up at the face, as a
     * vessel does, instead of lying on the region.
     */
    upright?: boolean;

    /**
     * `true` when the region's normal is read level, so an effector laid along
     * `up` stands on the world's up instead of on the region's slope: a
     * forefinger held upright across the lips, whose surface faces down as well
     * as forward. The region's own normal when absent.
     */
    level?: boolean;

    /**
     * The point of a held prop that meets the region when the task is performed
     * with one (`IAutoMovieMotionHumanHandToFace.IParams.prop`): a vessel's
     * `lip`, a phone's `screen`; the parameters name it when absent.
     */
    point?: string;

    /** The head's flexion at the face, degrees; negative extends it. */
    head: number;

    /** The event name at `ready`. */
    at: string;
  }
}
