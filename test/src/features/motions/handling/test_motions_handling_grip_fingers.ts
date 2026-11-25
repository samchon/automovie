import type { IAutoMoviePose } from "@automovie/interface";
import { HumanGrip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Pin the clinical finger angles that a performed hold forwards at a cut.
 *
 * Scenarios:
 * 1. The held hand retains a bent index and a bracing thumb including their
 *    abduction and twist. A neutral clinical axis becomes numeric zero.
 * 2. The opposite hand and wrist are not grip channels. Moving the wrist
 *    before the next act does not change the retained finger angles.
 */
export function test_motions_handling_grip_fingers(): void {
  const closed: IAutoMoviePose = {
    skeleton: "grip",
    root: null,
    joints: [
      { bone: "rightIndexProximal", flexion: 35, abduction: -4, twist: null },
      { bone: "rightThumbProximal", flexion: 14, abduction: 8, twist: -3 },
      { bone: "leftIndexProximal", flexion: 20, abduction: null, twist: null },
      { bone: "rightHand", flexion: 12, abduction: null, twist: null },
    ],
  };
  const expected: ReturnType<typeof HumanGrip.fingers> = {
    rightIndexProximal: [35, -4, 0],
    rightThumbProximal: [14, 8, -3],
  };
  TestValidator.equals("the held hand's exact finger angles", HumanGrip.fingers(closed, "right"), expected);
  TestValidator.equals(
    "a later wrist placement keeps the grasp",
    HumanGrip.fingers(
      {
        ...closed,
        joints: [
          ...closed.joints.filter((joint) => joint.bone !== "rightHand"),
          { bone: "rightHand", flexion: -6, abduction: 2, twist: null },
        ],
      },
      "right",
    ),
    expected,
  );
}
