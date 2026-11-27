import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * A glove a catching hand wears, as a catch reads it: where its `pocket` stands
 * from the palm (`createGlove`'s contacts).
 */
export namespace HumanGlove {
  /*
   * Where a glove's pocket stands from the palm of the hand that wears it, in
   * the hand's own axes, read at the action's entry: the glove rides the hand
   * rigidly, so the offset holds through the catch.
   * Parameter context: The action's context.
   * Parameter subject: The glove's prop subject.
   * Parameter sides: The catching hands.
   * Returns: The pocket from the palm's point, metres, in the hand bone's axes.
   * When the catch is two-handed, the glove is not worn
   * on the catching hand of this performer, or it declares no `pocket`.
   */
  export function pocket(
    context: Pick<IAutoMovieMotionHumanActionContext, PocketContext>,
    subject: string,
    sides: readonly AutoMovieHumanSide[],
  ): IAutoMovieVector3 {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const side: AutoMovieHumanSide = sides[0]!;
    const worn: IAutoMovieMotionHumanProp.IWorn | undefined = read.prop.worn;
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
    const frame: IAutoMovieRigidTransform = read.frame(context.start);
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
    const palm: IAutoMovieVector3 = HumanHand.preparePoint(
      context.body,
      side,
      "palm",
    )(bones);
    return Quaternion.rotateVector(
      Quaternion.inverse(bones.get(`${side}Hand`)!.worldRotation),
      Vector3.subtract(at, palm),
    );
  }
}

/*
 * The alternatives of `PocketContext`'s site.
 */
type PocketContext = "body" | "entry" | "prop" | "start" | "subject";
