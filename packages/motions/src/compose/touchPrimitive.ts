import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchForm,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTouchContacts } from "./AutoMovieMotionHumanTouchContacts";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { TOUCH_TIP } from "./TOUCH_TIP";
import { touchEnvelope } from "./touchEnvelope";
import { touchGoal } from "./touchGoal";

/**
 * A touch: the arm and the fingers on one clock. The arm's whole touch is
 * planned as one trajectory (`AutoMovieMotionHumanArmPlanned`): its reach
 * from its entry angles, its hold on the goal laid on the region from
 * `ready` to `relax` and its return, clear of the body all the way; a hand
 * path solved second by second would let the elbow change sides between them.
 * Between `strokeStart` and `strokeEnd` the goal is lifted along the
 * region's normal by `lift sin^2(pi n u)`, which touches down at every
 * repetition's end, and moved along its tangent by the clock's windowed
 * wave of `n` cycles. A held vessel keeps its attitude on the way
 * (`AutoMovieMotionHumanDrinkingArm.carried`).
 *
 * @param props The touch.
 * @returns The arm's and the hand's primitives, the arm's alone when the fingers are kept; the arm carries the contact window from `ready` to `relax` when a support is given and the hand, not a held tool, is what touches it, and one `lie` window over the same span for each of its segments declared resting (`ITouch.rests`).
 * @throws {Error} When the count is not a positive whole number.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the lift and travel formulas and the contact window.
 * @evidence contracts/development/implementation.md#principled-implementation A reach that lays a hand on a region is a motion-planning problem: the arm's whole action is one trajectory optimisation toward the goal laid on the region frame at each second of the hold, with the kind's offsets in that frame (`AutoMovieMotionHumanArm.carried` with a span).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry and one hand form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift and travel are shares of the hand; a count that is not whole throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory planned per touch (or per pair of hands), its goal read once per waypoint; per written second one cubic read of it; a vessel laid upright adds the attitude's three hand readings and one hand solve (`AutoMovieMotionHumanArm.ICarry.attitude`).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArm.carried`, `AutoMovieMotionHumanHand.form` and the effector's goal.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props and one hint.
 */
export function touchPrimitive(
  props: IAutoMovieMotionHumanTouch.ITouch,
): IAutoMovieMotionHumanPrimitive[] {
  const { body, clock, side } = props;
  const form: IAutoMovieMotionHumanTouchForm.IForm =
    AutoMovieMotionHumanTouchForm.FORMS[props.kind];
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: 0,
    to: clock.duration,
    rest: props.rest,
    weight: (seconds: number): number => touchEnvelope(clock, seconds),
    goal: touchGoal(props),
    // A person read as perceived when the plan starts, then followed on the hold.
    ...(props.perceived === undefined
      ? {}
      : {
          perceived: touchGoal({ ...props, ...props.perceived }),
          tracked: true,
        }),
    // The whole touch planned as one trajectory: the reach from `start`,
    // the hold from `ready` to `relax` and the return by `end`.
    span: {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    },
    ...(props.together === undefined ? {} : { together: props.together }),
    ...(props.rests === undefined ? {} : { rests: props.rests }),
    ...(props.skinDistance === undefined
      ? {}
      : { skinDistance: props.skinDistance }),
    ...(props.disc === undefined ? {} : { disc: props.disc }),
    ...(props.on === undefined ? {} : { on: props.on }),
    ...(props.lay !== "upright"
      ? {}
      : {
          attitude: AutoMovieMotionHumanDrinkingArm.carried(
            props,
            // The lean's share shown at a weight: none until the last `TIP`.
            (weight: number): number =>
              minimumJerk.share(
                Math.max(0, (weight - (1 - TOUCH_TIP)) / TOUCH_TIP),
              ),
          ),
        }),
  });
  // A held tool's point touches the body, not the hand: the hand gripping
  // the tool is not laid on the region, so it declares no contact with
  // the body there, and nothing excuses its fingers' depth in it.
  const tool: boolean =
    props.held !== undefined || props.effector.tool !== undefined;
  const contacts: IAutoMovieMotionHumanContactWindow[] =
    AutoMovieMotionHumanTouchContacts.windows(
      clock,
      side,
      tool && props.contact?.kind === "person" ? undefined : props.contact,
      props.rests ?? [],
    );
  return [
    {
      ...arm,
      ...(contacts.length === 0 ? {} : { contacts }),
    },
    ...(props.fingers === "keep"
      ? []
      : [
          AutoMovieMotionHumanHand.form(
            clock,
            side,
            ["start", "ready"],
            ["relax", "end"],
            props.effector.shape,
            form.curl,
          ),
        ]),
  ];
}
