import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain } from "@automovie/motions";
import {
  PULSE_HOLD,
  compressions,
  kneelBeside,
  pressWound,
  pulse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The compressions of one cycle: 30, the 30:2 compression-to-ventilation ratio
 * of adult CPR (2020 AHA Guidelines for CPR and ECC).
 */
const CYCLE: number = 30;

/**
 * The care laws compose one action each on the carer's chain:
 *
 * - `pulse` holds the partner's pulse site with the fingertips for `PULSE_HOLD`
 *   seconds, the carotid at the neck and the radial at the wrist, the right
 *   hand unless another is named;
 * - `compressions` presses the partner's sternum with both palms, arms straight,
 *   30 times with no hold;
 * - `pressWound` presses the wounded region with both palms once and holds;
 * - `kneelBeside` kneels on both knees at the given point and stays down.
 *
 * Scenarios, on a chain for subject `a` caring for `b`:
 *
 * 1. The carotid with no hand named, and the radial with the left hand.
 * 2. One cycle of compressions.
 * 3. A 5 s pressure on the left thigh's front.
 * 4. A kneel at (0.4, 0, 1).
 */
export function test_motions_touch_care(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.type === "intent") return node.intent;
    if (node.type === "sequence" || node.type === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  const of = (chain: { node: IAutoMovieComposition }) => {
    const intent: IAutoMovieIntent = last(chain.node);
    return [intent.capability, intent.parameters?.params];
  };
  TestValidator.equals(
    "the pulses",
    [
      of(pulse(AutoMovieMotionHumanChain.subject("a"), { partner: "b", site: "carotid" })),
      of(
        pulse(AutoMovieMotionHumanChain.subject("a"), {
          partner: "b",
          site: "radial",
          side: "left",
        }),
      ),
    ],
    [
      [
        "touch",
        {
          target: { kind: "person", subject: "b", region: "neckLeft" },
          hand: "right",
          kind: "hold",
          effector: "fingertips",
          hold: PULSE_HOLD,
        },
      ],
      [
        "touch",
        {
          target: { kind: "person", subject: "b", region: "wristLeft" },
          hand: "left",
          kind: "hold",
          effector: "fingertips",
          hold: PULSE_HOLD,
        },
      ],
    ],
  );
  TestValidator.equals(
    "the compressions",
    of(compressions(AutoMovieMotionHumanChain.subject("a"), { partner: "b" })),
    [
      "touch",
      {
        target: { kind: "person", subject: "b", region: "sternum" },
        other: { kind: "person", subject: "b", region: "sternum" },
        kind: "press",
        effector: "palm",
        arms: "straight",
        count: CYCLE,
        hold: 0,
      },
    ],
  );
  TestValidator.equals(
    "the pressure",
    of(
      pressWound(AutoMovieMotionHumanChain.subject("a"), {
        partner: "b",
        region: "thighFrontLeft",
        hold: 5,
      }),
    ),
    [
      "touch",
      {
        target: { kind: "person", subject: "b", region: "thighFrontLeft" },
        other: { kind: "person", subject: "b", region: "thighFrontLeft" },
        kind: "press",
        effector: "palm",
        count: 1,
        hold: 5,
      },
    ],
  );
  const at: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: 0.4, y: 0, z: 1 },
  };
  TestValidator.equals(
    "the kneel",
    of(kneelBeside(AutoMovieMotionHumanChain.subject("a"), { at })),
    ["kneel", { kind: "both", hold: 0, rise: false, at }],
  );
}
