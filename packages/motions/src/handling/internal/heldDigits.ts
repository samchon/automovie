import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionPropDrive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * The holding hand's digits kept on the moving contacts of a held prop's driven
 * articulations: the thumb in a scissor ring as the blade it rides swings, a
 * fingertip on a chopstick as it pinches.
 *
 * A held prop is rigid in the hand, so a contact riding one of its
 * articulations moves, in the hand's own frame, by the articulation's travel:
 * turned about a hinge's axis through its pivot, or slid along a slider's `+X`.
 * The digit's pad starts where the entry pose has it, in its grip on the
 * contact, and rides the contact rigidly from there, so it keeps that grip with
 * no jump as the work starts. A ring or a stick fixes where the pad bears, not
 * how it faces, so the goal is a place alone and the digit faces as its own
 * joints carry it there. The goal is written in that frame
 * (`IAutoMovieHumanDigitGoal.on`), so it holds whatever the arm does.
 * Parameter context: The action's context.
 * Parameter held: The held prop.
 * Parameter drive: The authored drives.
 * Parameter drives: The planned drives, one per authored drive.
 * Returns: The digit goals at an action second; empty when no drive names a
 * digit.
 * When a digit's contact does not ride its driven
 * articulation, or that articulation neither turns nor slides.
 */
export function heldDigits(
  context: IAutoMovieMotionHumanActionContext<object>,
  held: IAutoMovieMotionHumanHeld.IHeld,
  drive: readonly IAutoMovieMotionHumanHeldWork.IDrive[],
  drives: readonly IAutoMovieMotionPropDrive[],
): (
  seconds: number,
) => Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> {
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${held.side}Hand`)!;
  const worked: IWorked[] = [];
  drive.forEach((d: IAutoMovieMotionHumanHeldWork.IDrive, k: number): void => {
    if (d.by === undefined) return;
    const find: (id: string) => IAutoMovieAffordance | undefined = (
      id: string,
    ): IAutoMovieAffordance | undefined =>
      held.affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
    const joint: IAutoMovieAffordance = find(d.articulation)!;
    const site: IAutoMovieAffordance | undefined = find(d.by.site);
    if (
      site === undefined ||
      site.rides !== d.articulation ||
      (joint.kind !== "hinge" && joint.kind !== "slider")
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "drive",
        value: d.by.site,
        feasible: {
          kind: "alternatives",
          values: held.affordances
            .filter(
              (a: IAutoMovieAffordance): boolean => a.rides === d.articulation,
            )
            .map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `a digit works ${d.articulation} only on a contact that rides it, a hinge or a slider`,
        fix: "name a contact riding the driven hinge or slider",
      });
    const digit: AutoMovieHumanDigit = DIGITS[held.side][d.by.digit];
    // The pad's place in the hand's frame as the work begins.
    const surface: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
      context.body,
      bones,
      held.side,
      PADS[d.by.digit],
    );
    const pad: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(surface.point, hand.worldPosition),
    );
    // The joint's pivot and its axis (a turn's `+Y`, a slide's `+X`) in the
    // hand's frame, from the hand bone's origin as the pad is.
    const pivot: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        HumanHand.offset(context.body, held.side, "grip").point,
        held.frame.position,
      ),
      Quaternion.rotateVector(held.frame.rotation, joint.frame.translation),
    );
    const turning: boolean = joint.kind === "hinge";
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        Quaternion.multiply(held.frame.rotation, joint.frame.rotation),
        turning ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 },
      ),
    );
    worked.push({
      digit,
      drive: drives[k]!,
      pad,
      pivot,
      axis,
      turning,
      start: drives[k]!.travel(0),
    });
  });
  return (
    seconds: number,
  ): Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> => {
    const goals: Partial<
      Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>
    > = {};
    for (const w of worked) {
      // The pad rides the contact rigidly from where it is as the work
      // begins: turned about the hinge with it, or slid with it.
      const travel: number = w.drive.travel(seconds) - w.start;
      goals[w.digit] = {
        point: w.turning
          ? Vector3.add(
              w.pivot,
              Quaternion.rotateVector(
                Quaternion.fromAxisAngle(w.axis, travel),
                Vector3.subtract(w.pad, w.pivot),
              ),
            )
          : Vector3.add(w.pad, Vector3.scale(w.axis, travel)),
        surface: "pad",
        on: `${held.side}Hand`,
        contact: true,
      };
    }
    return goals;
  };
}

/*
 * The companion reader of heldDigits.
 */
export namespace heldDigits {
  /*
   * Where a contact riding an articulation lies at a travel, in its prop's
   * frame: turned about a turning joint's `+Y` through its pivot by the travel
   * in degrees (a hinge, a wheel, a knob, a crank), or slid along a slider's
   * `+X` by it in metres.
   * Parameter joint: The articulation the contact rides.
   * Parameter site: The contact.
   * Parameter travel: The articulation's travel.
   * Returns: Prop-local metres.
   */
  export function posed(
    joint: IAutoMovieAffordance,
    site: IAutoMovieAffordance,
    travel: number,
  ): IAutoMovieVector3 {
    const rest: IAutoMovieVector3 = site.frame.translation;
    const pivot: IAutoMovieVector3 = joint.frame.translation;
    return TURNING.has(joint.kind)
      ? Vector3.add(
          pivot,
          Quaternion.rotateVector(
            Quaternion.fromAxisAngle(
              Quaternion.rotateVector(joint.frame.rotation, {
                x: 0,
                y: 1,
                z: 0,
              }),
              travel,
            ),
            Vector3.subtract(rest, pivot),
          ),
        )
      : Vector3.add(
          rest,
          Vector3.scale(
            Quaternion.rotateVector(joint.frame.rotation, { x: 1, y: 0, z: 0 }),
            travel,
          ),
        );
  }
}

/*
 * The articulation kinds whose travel is a turn about the frame's `+Y`,
 * degrees; every other moves along `+X`.
 */
const TURNING: ReadonlySet<string> = new Set([
  "hinge",
  "wheel",
  "knob",
  "crank",
]);

/*
 * Each hand's digits by name.
 */
const DIGITS: Readonly<
  Record<
    AutoMovieHumanSide,
    Readonly<Record<IAutoMovieMotionHumanHeldWork.Digit, AutoMovieHumanDigit>>
  >
> = {
  left: {
    thumb: "leftThumb",
    index: "leftIndex",
    middle: "leftMiddle",
    ring: "leftRing",
    little: "leftLittle",
  },
  right: {
    thumb: "rightThumb",
    index: "rightIndex",
    middle: "rightMiddle",
    ring: "rightRing",
    little: "rightLittle",
  },
};

/*
 * A digit kept on a contact riding a driven articulation.
 */
interface IWorked {
  /*
   * The digit.
   */
  digit: AutoMovieHumanDigit;

  /*
   * The planned drive of the articulation.
   */
  drive: IAutoMovieMotionPropDrive;

  /*
   * The digit's pad in the hand's frame as the work begins.
   */
  pad: IAutoMovieVector3;

  /*
   * The articulation's pivot in the hand's frame, metres.
   */
  pivot: IAutoMovieVector3;

  /*
   * The unit axis a hinge turns about, or a slider slides along, in the hand's
   * frame.
   */
  axis: IAutoMovieVector3;

  /*
   * Whether the articulation turns (a hinge) rather than slides.
   */
  turning: boolean;

  /*
   * The articulation's travel as the work begins.
   */
  start: number;
}

/*
 * Each digit's pad, the hand surface that bears on its contact.
 */
const PADS: Readonly<
  Record<IAutoMovieMotionHumanHeldWork.Digit, IAutoMovieMotionHumanHand.Surface>
> = {
  thumb: "thumbPad",
  index: "indexPad",
  middle: "middlePad",
  ring: "ringPad",
  little: "littleTip",
};
