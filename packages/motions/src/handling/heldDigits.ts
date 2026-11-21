import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionPropDrive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";

/**
 * The holding hand's digits kept on the moving contacts of a held prop's
 * driven articulations: the thumb in a scissor ring as the blade it rides
 * swings, a fingertip on a chopstick as it pinches.
 *
 * A held prop is rigid in the hand, so a contact riding one of its
 * articulations lies, in the hand's own frame, where the articulation's
 * travel puts it: turned about a hinge's axis through its pivot, or slid
 * along a slider's `+X`, from its declared place, then carried by the
 * grip's fixed offset from the wrist. The goal is written in that frame
 * (`IAutoMovieHumanDigitGoal.on`), so it holds whatever the arm does, and
 * the digit's pad bears on it.
 *
 * @param context The action's context.
 * @param held The held prop.
 * @param drive The authored drives.
 * @param drives The planned drives, one per authored drive.
 * @returns The digit goals at an action second; empty when no drive names a digit.
 * @throws {HumanRefusal} When a digit's contact does not ride its driven articulation, or that articulation neither turns nor slides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rigid-hold premise, the closed-form place and the frame of the goal.
 * @evidence contracts/development/implementation.md#principled-implementation A hinge turns the contact about its axis through the pivot by the travel; a slider moves it along its axis; the held offset carries it into the hand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit each digit's contact once, then place every digit per second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact that does not ride the articulation is refused, never guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rotation per digit per second, in closed form.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planned drives' own travel, so digit and part move on one clock.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader closes over the admitted contacts and drives only.
 */
export function heldDigits(
  context: IAutoMovieMotionHumanActionContext<object>,
  held: IAutoMovieMotionHumanHeld.IHeld,
  drive: readonly IAutoMovieMotionHumanHeldWork.IDrive[],
  drives: readonly IAutoMovieMotionPropDrive[],
): (
  seconds: number,
) => Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> {
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    held.side,
    "grip",
  ).point;
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
      throw new HumanRefusal({
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
    worked.push({ digit, joint, site, drive: drives[k]! });
  });
  return (
    seconds: number,
  ): Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> => {
    const goals: Partial<
      Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>
    > = {};
    for (const w of worked) {
      const travel: number = w.drive.travel(seconds);
      const rest: IAutoMovieVector3 = w.site.frame.translation;
      const pivot: IAutoMovieVector3 = w.joint.frame.translation;
      const local: IAutoMovieVector3 =
        w.joint.kind === "hinge"
          ? Vector3.add(
              pivot,
              Quaternion.rotateVector(
                Quaternion.fromAxisAngle(
                  Quaternion.rotateVector(w.joint.frame.rotation, {
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
                Quaternion.rotateVector(w.joint.frame.rotation, {
                  x: 1,
                  y: 0,
                  z: 0,
                }),
                travel,
              ),
            );
      goals[w.digit] = {
        point: Vector3.add(
          grip,
          Vector3.add(
            held.frame.position,
            Quaternion.rotateVector(held.frame.rotation, local),
          ),
        ),
        surface: "pad",
        on: `${held.side}Hand`,
        contact: true,
      };
    }
    return goals;
  };
}

/** Each hand's digits by name. */
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

/** A digit kept on a contact riding a driven articulation. */
interface IWorked {
  /** The digit. */
  digit: AutoMovieHumanDigit;

  /** The driven articulation. */
  joint: IAutoMovieAffordance;

  /** The contact the digit stays on. */
  site: IAutoMovieAffordance;

  /** The planned drive of the articulation. */
  drive: IAutoMovieMotionPropDrive;
}
