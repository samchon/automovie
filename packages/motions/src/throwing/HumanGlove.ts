import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * A glove a catching hand wears, as a catch reads it: where its `pocket`
 * stands from the palm (`createGlove`'s contacts).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and from which contact.
 * @evidence contracts/development/design.md#principled-representation The pocket's offset in the hand's axes, the fact a catch needs of a glove.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, used by `catchObject`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pocket is the glove's own contact; no glove size is typed.
 */
export namespace HumanGlove {
  /**
   * Where a glove's pocket stands from the palm of the hand that wears it, in
   * the hand's own axes, read at the action's entry: the glove rides the hand
   * rigidly, so the offset holds through the catch.
   *
   * @param context The action's context.
   * @param subject The glove's prop subject.
   * @param sides The catching hands.
   * @returns The pocket from the palm's point, metres, in the hand bone's axes.
   * @throws {HumanRefusal} When the catch is two-handed, the glove is not worn on the catching hand of this performer, or it declares no `pocket`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame of the result, when it is read and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A worn prop is rigid on its bone, so the pocket's place from the palm in the hand's axes, read once at the entry, holds for the catch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The wearing check, the pocket's lookup, one change of frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A glove not worn on the catching hand, or without a pocket, is refused, never caught with from where it lies.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward kinematics of the entry pose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pocket(
    context: Pick<
      IHumanActionContext,
      "body" | "entry" | "prop" | "start" | "subject"
    >,
    subject: string,
    sides: readonly HumanHand.Side[],
  ): IAutoMovieVector3 {
    const read: IHumanActionContext.IProp = context.prop(subject);
    const side: HumanHand.Side = sides[0]!;
    const worn: IHumanProp.IWorn | undefined = read.prop.worn;
    if (
      sides.length !== 1 ||
      worn === undefined ||
      worn.subject !== context.subject ||
      worn.bone !== `${side}Hand`
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "glove",
        value: subject,
        reason:
          sides.length !== 1
            ? "a glove catches in one hand, and this catch is two-handed"
            : `${subject} is not worn on ${context.subject}'s ${side} hand`,
        fix: `wear ${subject} on the catching hand (IHumanProp.worn on ${side}Hand), or catch bare-handed`,
      });
    const pocket: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "pocket");
    if (pocket === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "glove",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: (read.prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `${subject} declares no pocket to catch in`,
        fix: "wear a glove that declares its pocket, as createGlove does",
      });
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const at: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, pocket.frame.translation),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(context.body, context.entry.pose);
    const palm: HumanHand.IFrame = HumanHand.frame(
      context.body,
      bones,
      side,
      "palm",
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(bones.get(`${side}Hand`)!.worldRotation),
      Vector3.subtract(at, palm.point),
    );
  }
}
