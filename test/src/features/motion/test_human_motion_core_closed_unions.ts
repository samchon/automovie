import {
  AutoMovieMotionHumanBend,
  AutoMovieMotionHumanChannel,
  AutoMovieMotionHumanGaze,
  AutoMovieMotionHumanInterrupt,
  AutoMovieMotionHumanRange,
  AutoMovieMotionHumanReach,
  AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanTiming,
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  AutoMovieMotionManner,
  HumanBase,
  HumanFoot,
  HumanHand,
  HumanObstacle,
  HumanRefusal,
  IHumanContactWindow,
  IHumanInterruptRow,
  IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** Whether two types hold the same members. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * Each closed union of the grammar is also a list a page can read, and the
 * list and the union hold the same members.
 *
 * Scenarios:
 * 1. At compile time, each list's members are exactly its union's: the
 *    manner presets' names against the preset record's keys and the union
 *    written out, the others against the union read from them, and the
 *    side every paired part takes against the hand's.
 * 2. At run time, no list repeats a member, and the preset names are
 *    exactly the preset record's keys, none missing and none extra.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exported lists and the types they back; a list that misses or repeats a member, or a preset name the record lacks, fails the type check or the run.
 * @evidence contracts/development/testing.md#independent-expectations The preset names are checked against the preset record itself, the one list not derived from its union; the other unions are read from their lists, so the check is that each list is a set.
 * @evidence contracts/development/testing.md#distinguishing-cases Every list of the grammar's public types, with the one hand-written list checked both ways.
 * @evidence contracts/development/testing.md#execution-ownership Reads constants only, in a few milliseconds.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios.
 */
export function test_human_motion_core_closed_unions(): void {
  // 1. At compile time.
  const same: readonly true[] = [
    true satisfies Same<
      (typeof AutoMovieMotionManner.PRESET_NAMES)[number],
      AutoMovieMotionManner.Preset
    >,
    true satisfies Same<
      AutoMovieMotionManner.Preset,
      keyof typeof AutoMovieMotionManner.PRESETS
    >,
    true satisfies Same<AutoMovieMotionHumanBend.Side, HumanHand.Side>,
    true satisfies Same<IHumanPosture.Limb, AutoMovieMotionHumanReach.Limb>,
  ];

  // 2. At run time.
  const lists: Record<string, readonly string[]> = {
    "AutoMovieMotionHumanChannel.ORDER": AutoMovieMotionHumanChannel.ORDER,
    "AutoMovieMotionManner.PRESET_NAMES": AutoMovieMotionManner.PRESET_NAMES,
    "AutoMovieMotionHumanInterrupt.WINDOWS":
      AutoMovieMotionHumanInterrupt.WINDOWS,
    "AutoMovieMotionHumanInterrupt.BLEND_NAMES":
      AutoMovieMotionHumanInterrupt.BLEND_NAMES,
    "AutoMovieMotionHumanTiming.PAUSE_NAMES":
      AutoMovieMotionHumanTiming.PAUSE_NAMES,
    "AutoMovieMotionHumanGaze.RECRUITS": AutoMovieMotionHumanGaze.RECRUITS,
    "AutoMovieMotionHumanRange.LEVEL_NAMES":
      AutoMovieMotionHumanRange.LEVEL_NAMES,
    "AutoMovieMotionHumanRange.MOTIONS": AutoMovieMotionHumanRange.MOTIONS,
    "AutoMovieMotionHumanReach.POLICIES": AutoMovieMotionHumanReach.POLICIES,
    "AutoMovieMotionHumanReach.LIMBS": AutoMovieMotionHumanReach.LIMBS,
    "AutoMovieMotionHumanTarget.HEIGHTS": AutoMovieMotionHumanTarget.HEIGHTS,
    "AutoMovieMotionHumanTarget.LATERAL_NAMES":
      AutoMovieMotionHumanTarget.LATERAL_NAMES,
    "AutoMovieMotionHumanTarget.DISTANCE_NAMES":
      AutoMovieMotionHumanTarget.DISTANCE_NAMES,
    "AutoMovieMotionHumanTouchEffector.AXES":
      AutoMovieMotionHumanTouchEffector.AXES,
    "AutoMovieMotionHumanTouchForm.KINDS": AutoMovieMotionHumanTouchForm.KINDS,
    "AutoMovieMotionHumanTouchForm.TANGENTS":
      AutoMovieMotionHumanTouchForm.TANGENTS,
    "AutoMovieMotionHumanBend.ARMS": AutoMovieMotionHumanBend.ARMS,
    "HumanHand.SIDES": HumanHand.SIDES,
    "HumanHand.SURFACES": HumanHand.SURFACES,
    "HumanHand.SHAPES": HumanHand.SHAPES,
    "HumanHand.AXES": HumanHand.AXES,
    "HumanFoot.SOCKETS": HumanFoot.SOCKETS,
    "IHumanPosture.LIMBS": IHumanPosture.LIMBS,
    "HumanBase.KINDS": HumanBase.KINDS,
    "HumanBase.MOUNTS": HumanBase.MOUNTS,
    "HumanRefusal.KINDS": HumanRefusal.KINDS,
    "IHumanContactWindow.KINDS": IHumanContactWindow.KINDS,
    "IHumanInterruptRow.KINDS": IHumanInterruptRow.KINDS,
    "IHumanInterruptRow.KEEPS": IHumanInterruptRow.KEEPS,
    "HumanObstacle.CAUSES": HumanObstacle.CAUSES,
  };
  const complaints: string[] = [];
  if (same.length !== 4) complaints.push("a compile-time check is missing");
  for (const [name, list] of Object.entries(lists))
    if (new Set(list).size !== list.length || list.length === 0)
      complaints.push(`${name} repeats a member or is empty: ${list.join(", ")}`);
  const order = (a: string, b: string): number => a.localeCompare(b);
  const presets: string[] = Object.keys(AutoMovieMotionManner.PRESETS).sort(
    order,
  );
  const names: string[] = [...AutoMovieMotionManner.PRESET_NAMES].sort(order);
  if (presets.join(",") !== names.join(","))
    complaints.push(
      `the preset names ${names.join(", ")} are not the preset record's keys ${presets.join(", ")}`,
    );
  TestValidator.equals("each closed union is a list", complaints, []);
}
