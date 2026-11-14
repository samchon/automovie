import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanHand } from "../posture/HumanHand";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";

/**
 * A touch's contact windows from `ready` to `relax`: the hand's grip on
 * what it bears on, and the touching arm's segments that lie on a person's
 * segment while the hand is on its region, as a self-hug's forearms lie on
 * each other and on the chest: what a touch row declares as rests, each
 * arm's rests, and the windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a rest is, the two forms it takes and the window it becomes.
 * @evidence contracts/development/design.md#principled-representation A segment on a segment: the arm's segment and the bone it lies along, which a region's point and frame would not locate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The row's declaration, an arm's rest, the reading of one into the other and the windows; the touch law and the touch stroke read them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The window is the contact window's own `lie` on a person's segment (`IHumanContactWindow.Support`).
 */
export namespace AutoMovieMotionHumanTouchContacts {
  /**
   * A rest as a touch row declares it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and how a side is read.
   * @evidence contracts/development/design.md#principled-representation The hand whose arm it is, its segment and the bone, so a row reads the same whichever hand leads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by `sided`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bone is the rig's own name, mirrored with the leading hand rather than restated per side.
   */
  export interface IDeclared {
    /** Whose arm: the leading hand's or the other's. */
    hand: "first" | "other";

    /** The arm's segment. */
    part: "upperArm" | "lowerArm";

    /** The bone it lies along, named as for the right hand leading; its side is exchanged when the left hand leads. */
    on: AutoMovieHumanoidBone;
  }

  /**
   * One arm's rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The arm's segment, the bone it lies along and whose bone it is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all written into the window.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The arm's own side is the touch's, so only its segment is named.
   */
  export interface IRest {
    /** The touching arm's segment. */
    part: "upperArm" | "lowerArm";

    /** The bone it lies along. */
    on: AutoMovieHumanoidBone;

    /** The person whose bone it is. */
    subject: string;
  }

  /**
   * Each arm's rests of a row's declaration.
   *
   * @param declared The row's rests; none when absent.
   * @param first The leading hand.
   * @param both Whether the touch moves both hands.
   * @param subject The performer, whose body the arms rest on.
   * @returns A hand's rests.
   * @throws {HumanRefusal} When a rest names the other hand's arm on a touch of one hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A row is written for the right hand leading, so a left-led touch exchanges the sides of the bones as it exchanges its hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check, then one filter and one map per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rest of an arm the touch does not move is refused, not dropped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the declared rests with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Closes over its arguments only.
   */
  export function sided(
    declared: readonly IDeclared[] | undefined,
    first: HumanHand.Side,
    both: boolean,
    subject: string,
  ): (side: HumanHand.Side) => IRest[] {
    const rests: readonly IDeclared[] = declared ?? [];
    if (
      !both &&
      rests.some((rest: IDeclared): boolean => rest.hand === "other")
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "rests",
        value: rests,
        reason:
          "a rest names the other hand's arm, but the touch moves one hand",
        fix: "give the other hand its region with `other`, or rest the leading arm",
      });
    const mirror = (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone =>
      first === "right"
        ? bone
        : bone.startsWith("left")
          ? (`right${bone.slice(4)}` as AutoMovieHumanoidBone)
          : bone.startsWith("right")
            ? (`left${bone.slice(5)}` as AutoMovieHumanoidBone)
            : bone;
    return (side: HumanHand.Side): IRest[] =>
      rests
        .filter(
          (rest: IDeclared): boolean =>
            (rest.hand === "first") === (side === first),
        )
        .map(
          (rest: IDeclared): IRest => ({
            part: rest.part,
            on: mirror(rest.on),
            subject,
          }),
        );
  }

  /**
   * A touch's windows from `ready` to `relax`: the hand's `grip` on what it
   * bears on, and a `lie` of each of the arm's resting segments on the
   * person's segment.
   *
   * @param clock The touch's clock.
   * @param side The arm.
   * @param hand What the hand bears on; no grip window when absent.
   * @param rests The arm's rests.
   * @returns The windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the kind and the span.
   * @evidence contracts/development/implementation.md#principled-implementation A rest holds while the hand is on its region, the span the hand's own window covers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The hand's window, then one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the rests with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function windows(
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    hand: IHumanContactWindow.Support | undefined,
    rests: readonly IRest[],
  ): IHumanContactWindow[] {
    const from: number = clock.at("ready") / clock.duration;
    const to: number = clock.at("relax") / clock.duration;
    return [
      ...(hand === undefined
        ? []
        : [
            {
              part: `${side}Hand` as const,
              kind: "grip" as const,
              from,
              to,
              support: hand,
            },
          ]),
      ...rests.map(
        (rest: IRest): IHumanContactWindow => ({
          part: `${side}${rest.part === "upperArm" ? "UpperArm" : "LowerArm"}`,
          kind: "lie",
          from,
          to,
          support: { kind: "person", subject: rest.subject, bone: rest.on },
        }),
      ),
    ];
  }
}
