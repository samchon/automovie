import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { HumanSegmentEntry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A contact window over shares of the plan. */
function window(
  part: IAutoMovieMotionHumanContactWindow["part"],
  kind: IAutoMovieMotionHumanContactWindow["kind"],
  from: number,
  to: number,
): IAutoMovieMotionHumanContactWindow {
  return { part, kind, from, to, support: { kind: "ground" } };
}

/**
 * `HumanSegmentEntry.supports` is what the body rests on as an action is left
 * at a second: the contact windows open at the second's share of the plan, `(t
 * − start) / duration` held within [0, 1], ends included, a grip and a strike
 * aside, each read as its part, kind and support; before any action, both feet
 * planted on the ground.
 *
 * A plan from 2 s lasting 4 s: the left foot planted over shares 0 to 0.5, the
 * right foot from 0.25 to 1, the right hand gripping and the left hand striking
 * throughout.
 *
 * Scenarios:
 *
 * 1. Before any action, both feet on the ground.
 * 2. At 3 s, share 0.25: both feet, not the grip or the strike.
 * 3. At 4 s, share 0.5, the left foot's last share: both feet still.
 * 4. At 5 s, share 0.75: the right foot alone.
 * 5. At 1 s and 9 s the share is held at 0 and 1: the left foot, then the right.
 */
export function test_unit_motions_perform_segment_entry_supports(): void {
  // 1. No action.
  TestValidator.equals(
    "both feet on the ground before any action",
    HumanSegmentEntry.supports(undefined, 0),
    [
      { part: "leftFoot", kind: "plant", support: { kind: "ground" } },
      { part: "rightFoot", kind: "plant", support: { kind: "ground" } },
    ],
  );

  // 2 to 5. The windows open at a share.
  const previous: HumanSegmentEntry.ISupportsPrevious = {
    start: 2,
    plan: {
      duration: 4,
      contacts: [
        window("leftFoot", "plant", 0, 0.5),
        window("rightFoot", "plant", 0.25, 1),
        window("rightHand", "grip", 0, 1),
        window("leftHand", "strike", 0, 1),
      ],
    },
  };
  const parts = (seconds: number): string[] =>
    HumanSegmentEntry.supports(previous, seconds).map(
      (s: ReturnType<typeof HumanSegmentEntry.supports>[number]): string =>
        s.part,
    );
  TestValidator.equals(
    "the open windows at each share",
    [parts(3), parts(4), parts(5), parts(1), parts(9)],
    [
      ["leftFoot", "rightFoot"],
      ["leftFoot", "rightFoot"],
      ["rightFoot"],
      ["leftFoot"],
      ["rightFoot"],
    ],
  );
}
