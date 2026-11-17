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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Wearing/contact checks precede actual prop-frame placement, canonical entry-hand FK and the shared point-only palm reader before the original inverse-hand transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A glove not worn on the catching hand, or without a pocket, is refused, never caught with from where it lies.
   * @evidence contracts/development/implementation.md#efficient-algorithms Entry FK demands only the actual hand ancestry and admits every current authored joint. The non-digit palm point omits its two unused normal/forward vector rotations and frame wrapper; original pocket/inverse arithmetic remains and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The genuine canonical body owns palm surface geometry, while the displayed bones are fresh numerical FK output from this same query. Only that metadata and shared point formula are used; no prop frame, raw posture, palm result or callback observation is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local entry bones and point-reader scratch release at return or throw. Only the fresh wrist-local pocket vector escapes without body/context, FK workspace, sample history or external handle.
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
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    );
    const palm: IAutoMovieVector3 = HumanHand.preparePoint(context.body, side, "palm")(bones);
    return Quaternion.rotateVector(
      Quaternion.inverse(bones.get(`${side}Hand`)!.worldRotation),
      Vector3.subtract(at, palm),
    );
  }
}
