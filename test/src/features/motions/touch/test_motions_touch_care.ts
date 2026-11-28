import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain } from "@automovie/motions";
import {
  PULSE_HOLD
} from "../../../../../packages/motions/src/touch/care/PULSE_HOLD";
import {
  compressions
} from "../../../../../packages/motions/src/touch/care/compressions";
import {
  kneelBeside
} from "../../../../../packages/motions/src/touch/care/kneelBeside";
import {
  pressWound
} from "../../../../../packages/motions/src/touch/care/pressWound";
import {
  pulse
} from "../../../../../packages/motions/src/touch/care/pulse";
import { TestValidator } from "@nestia/e2e";

/**
 * The compressions of one cycle: 30, the 30:2 compression-to-ventilation ratio
 * of adult CPR (2020 AHA Guidelines for CPR and ECC).
 */
const CYCLE: number = 30;

/**
 * Check the authored requests produced by the care composers.
 *
 * Scenarios:
 *
 * 1. Compose a right-hand carotid check by default and a left-hand radial
 *    check on request.
 * 2. Compose 30 palm compressions, one five-second wound pressure on the left
 *    thigh, and a both-knee kneel at (0.4, 0, 1).
 *
 * @evidence contracts/development/common.md#meaningful-documentation The compositions identify the partner regions, hands, holds and kneel location.
 * @evidence contracts/development/testing.md#behavioral-verification Each helper's appended intent is compared with the typed request expected by its chain caller.
 * @evidence contracts/development/testing.md#independent-expectations The expected requests specify all selected fields directly from the input and each composer's stated default.
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
