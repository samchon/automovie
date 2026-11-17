import type { AutoMovieHumanoidBone, IAutoMovieMotionClock, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanTouchContacts } from "@automovie/interface";


import { HumanRefusal } from "../law/HumanRefusal";

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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The window is the contact window's own `lie` on a person's segment (`HumanContactWindow.Support`).
 */
export namespace AutoMovieMotionHumanTouchContacts {

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
    declared: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[] | undefined,
    first: IAutoMovieMotionHumanHand.Side,
    both: boolean,
    subject: string,
  ): (side: IAutoMovieMotionHumanHand.Side) => IAutoMovieMotionHumanTouchContacts.IRest[] {
    const rests: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[] = declared ?? [];
    if (
      !both &&
      rests.some((rest: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean => rest.hand === "other")
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
    return (side: IAutoMovieMotionHumanHand.Side): IAutoMovieMotionHumanTouchContacts.IRest[] =>
      rests
        .filter(
          (rest: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean =>
            (rest.hand === "first") === (side === first),
        )
        .map(
          (rest: IAutoMovieMotionHumanTouchContacts.IDeclared): IAutoMovieMotionHumanTouchContacts.IRest => ({
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
    clock: IAutoMovieMotionClock.IClock,
    side: IAutoMovieMotionHumanHand.Side,
    hand: IAutoMovieMotionHumanContactWindow.Support | undefined,
    rests: readonly IAutoMovieMotionHumanTouchContacts.IRest[],
  ): IAutoMovieMotionHumanContactWindow[] {
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
        (rest: IAutoMovieMotionHumanTouchContacts.IRest): IAutoMovieMotionHumanContactWindow => ({
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
