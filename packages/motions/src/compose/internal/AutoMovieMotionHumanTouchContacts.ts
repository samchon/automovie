import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanTouchContacts,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A touch's contact windows from `ready` to `relax`: the hand's grip on what it
 * bears on, and the touching arm's segments that lie on a person's segment
 * while the hand is on its region, as a self-hug's forearms lie on each other
 * and on the chest: what a touch row declares as rests, each arm's rests, and
 * the windows.
 */
export namespace AutoMovieMotionHumanTouchContacts {
  /*
   * Each arm's rests of a row's declaration.
   * Parameter declared: The row's rests; none when absent.
   * Parameter first: The leading hand.
   * Parameter both: Whether the touch moves both hands.
   * Parameter subject: The performer, whose body the arms rest on.
   * Returns: A hand's rests.
   * When a rest names the other hand's arm on a touch of
   * one hand.
   */
  export function sided(
    declared:
      | readonly IAutoMovieMotionHumanTouchContacts.IDeclared[]
      | undefined,
    first: AutoMovieHumanSide,
    both: boolean,
    subject: string,
  ): (side: AutoMovieHumanSide) => IAutoMovieMotionHumanTouchContacts.IRest[] {
    const rests: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[] =
      declared ?? [];
    if (
      !both &&
      rests.some(
        (rest: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean =>
          rest.hand === "other",
      )
    )
      throw new AutoMovieMotionHumanRefusal({
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
    return (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanTouchContacts.IRest[] =>
      rests
        .filter(
          (rest: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean =>
            (rest.hand === "first") === (side === first),
        )
        .map(
          (
            rest: IAutoMovieMotionHumanTouchContacts.IDeclared,
          ): IAutoMovieMotionHumanTouchContacts.IRest => ({
            part: rest.part,
            on: mirror(rest.on),
            subject,
          }),
        );
  }

  /*
   * A touch's windows from `ready` to `relax`: the hand's `grip` on what it
   * bears on, and a `lie` of each of the arm's resting segments on the person's
   * segment.
   * Parameter clock: The touch's clock.
   * Parameter side: The arm.
   * Parameter hand: What the hand bears on; no grip window when absent.
   * Parameter rests: The arm's rests.
   * Returns: The windows.
   */
  export function windows(
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
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
        (
          rest: IAutoMovieMotionHumanTouchContacts.IRest,
        ): IAutoMovieMotionHumanContactWindow => ({
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
