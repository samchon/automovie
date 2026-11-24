import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { PULSE_HOLD, pulse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `pulse` appends one fingertip `touch` that holds the partner's pulse site for
 * `PULSE_HOLD` seconds: the carotid at the neck, the radial at the wrist, with
 * the right hand unless another is named.
 *
 * Scenarios, on a chain for subject `a`:
 *
 * 1. The carotid of `b` with no hand named: the right fingertips hold `b`'s neck
 *    for `PULSE_HOLD` seconds.
 * 2. The radial pulse with the left hand holds `b`'s wrist.
 */
export function test_unit_motions_touch_pulse(): void {
  const last = (node: IAutoMovieComposition): IAutoMovieIntent => {
    if (node.kind === "intent") return node.intent;
    if (node.kind === "sequence" || node.kind === "parallel")
      return last(node.parts[node.parts.length - 1]!);
    throw new Error("An anchored node carries no intent of its own");
  };
  TestValidator.equals(
    "the carotid",
    last(pulse(HumanChain.subject("a"), { partner: "b", site: "carotid" }).node)
      .parameters?.params,
    {
      target: { kind: "person", subject: "b", region: "neckLeft" },
      hand: "right",
      kind: "hold",
      effector: "fingertips",
      hold: PULSE_HOLD,
    },
  );
  const radial: IAutoMovieIntent = last(
    pulse(HumanChain.subject("a"), {
      partner: "b",
      site: "radial",
      side: "left",
    }).node,
  );
  TestValidator.equals(
    "the radial pulse",
    [radial.capability, radial.parameters?.params],
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
  );
}
