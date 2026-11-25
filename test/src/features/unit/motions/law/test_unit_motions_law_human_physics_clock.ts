import type { AutoMovieMotionHumanScheduledInstant } from "@automovie/interface";
import { HumanPhysics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** At most six binary64 operations convert the clock and normalize each ramp. */
const ROUNDING: number = 32 * Number.EPSILON * 8;

/**
 * Resolve authored correction bounds in their own clock frames.
 *
 * Scenarios:
 *
 * 1. The second local pulse, shifted half a second earlier, opens at 1.5 s. An
 *    external cue at film second 74.5 closes at local second 4.5.
 * 2. A 2:1 pair of finite ramps whose sum overflows still meets at second 3.5 with
 *    a full weight. Both authored ratios survive the compression.
 * 3. An absent occurrence, unresolved external anchor or backwards window is
 *    refused. A window wholly beyond the action evaluates to none.
 */
export function test_unit_motions_law_human_physics_clock(): void {
  const timing: HumanPhysics.ITiming = {
    duration: 8,
    events: [
      { name: "pulse", share: 0.125 },
      { name: "other", share: 0.1875 },
      { name: "pulse", share: 0.25 },
    ],
  };
  const params: HumanPhysics.IBalanced = {
    balance: {
      by: "hips",
      from: { event: "pulse", index: 1, offset: -0.5 },
      to: { of: "score", event: "beat", index: 2, offset: 0.25 },
      ramp: { in: 1.5e308, out: 7.5e307 },
    },
  };
  const resolve = (instant: AutoMovieMotionHumanScheduledInstant): number => {
    TestValidator.equals("resolve the original ordered cue address", instant, {
      of: "score",
      event: "beat",
      index: 2,
      offset: 0.25,
    });
    return 74.5;
  };
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    params,
    {},
    70,
    timing,
    resolve,
  );
  TestValidator.predicate(
    "the endpoints and the compressed ratio stay on the action clock",
    window !== null &&
      nclose(window.from, 1.5, ROUNDING) &&
      nclose(window.to, 4.5, ROUNDING) &&
      nclose(window.ramp.in, 2, ROUNDING) &&
      nclose(window.ramp.out, 1, ROUNDING) &&
      nclose(HumanPhysics.weightAt(window, 3.5), 1, ROUNDING),
  );
  const withBounds = (
    from: NonNullable<NonNullable<HumanPhysics.IBalanced["balance"]>["from"]>,
    to: NonNullable<NonNullable<HumanPhysics.IBalanced["balance"]>["to"]>,
  ): HumanPhysics.IBalanced => ({ balance: { by: "hips", from, to } });
  TestValidator.predicate(
    "unresolvable and backwards bounds are separate refusals",
    throwsError(
      (): unknown => HumanPhysics.prepare(params, {}, 70, timing),
      "resolve that anchor",
    ) &&
      throwsError(
        (): unknown =>
          HumanPhysics.prepare(
            withBounds({ event: "pulse", index: 2 }, { event: "end" }),
            {},
            70,
            timing,
          ),
        "occurrence",
      ) &&
      throwsError(
        (): unknown =>
          HumanPhysics.prepare(
            withBounds({ event: "end" }, { event: "start" }),
            {},
            70,
            timing,
          ),
        "end at or after",
      ) &&
      HumanPhysics.prepare(
        withBounds({ event: "end", offset: 1 }, { event: "end", offset: 2 }),
        {},
        70,
        timing,
      ) === null,
  );
}
