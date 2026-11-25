import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Giving way to a contact: the head turned aside by a slap, or the trunk
 * carried by a hand that pushes or pulls, then a return to what the body held.
 * It is the receiver's part of a stage slap, a grab or a light push that does
 * not cost the feet their place; a push that does is `stagger`. A leg giving
 * way to a low kick is not a give: use `stagger` or a short `step`.
 *
 * The contact comes from a target (the striking hand, the grabbing arm), read
 * one look before the start. The head turns about the neck to the side away
 * from it, by `TURN` at full intensity with a slight tilt the same way; the
 * trunk leans from the hips and shifts away from it, or toward it when it
 * pulls. The movement starts at the action's start, peaks after `RISE` and
 * returns over `RETURN`. Sync the action's start to the contact of the action
 * it answers.
 *
 * It rides whatever base the body is on (standing, seated) and claims the head,
 * or the root and the trunk; the feet and the arms stay as they were.
 *
 * Every size and time is provisional: the research located no study of a
 * slapped head's rotation, and the stage-combat convention (the receiver turns
 * the head with the hand's passage) gives the direction only.
 */
export namespace IAutoMovieMotionHumanGive {
  /** Parameters. */
  export interface IParams {
    /** Where the contact comes from; a place ahead of the performer when absent. */
    target?: IAutoMovieMotionTarget;

    /** What gives way; `head` when absent. */
    part?: "head" | "trunk";

    /**
     * Whether the part goes away from the contact (a slap, a push) or toward it
     * (a pull); `away` when absent.
     */
    way?: "away" | "toward";

    /**
     * How strong, in (0, 1]; 1 when absent. It scales the size and not the
     * time: at 1 the head turns 45 degrees with an 8 degree tilt, or the trunk
     * shifts 3 % of the stature (`give.TURN`, `give.TILT`, `give.SHIFT`,
     * provisional), peaking at 0.12 s, held 0.15 s and back 0.45 s after the
     * hold, 0.72 s from the start (`give.RISE`, `give.RETURN`). 1 fits a slap;
     * less fits a light push or a nudge.
     */
    intensity?: number;
  }
}
