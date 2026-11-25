import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionEvent,
} from "@automovie/interface";
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
 * 4. A named clock supplies events once when its first local bound needs them. An
 *    inactive, direct or earlier-refused bound requires no event read.
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

  const calls: string[] = [];
  const clock: HumanPhysics.IClock = {
    duration: timing.duration,
    events: (): IAutoMovieMotionEvent[] => {
      calls.push("events");
      return [...timing.events];
    },
  };
  const local = withBounds({ event: "pulse" }, { event: "pulse", index: 1 });
  const direct = withBounds({ event: "start" }, { event: "end" });
  const badOpening = withBounds(
    { event: "pulse", index: -1 },
    { event: "pulse" },
  );
  const external = withBounds(
    { of: "score", event: "beat" },
    { event: "pulse" },
  );
  TestValidator.predicate(
    "an inactive, direct or earlier-refused request never reads events",
    HumanPhysics.fromClock({}, {}, 70, clock) === null &&
      HumanPhysics.fromClock(
        { balance: { ...local.balance, weight: 0 } },
        {},
        70,
        clock,
      ) === null &&
      HumanPhysics.fromClock(direct, {}, 70, clock)?.to === 8 &&
      throwsError(
        () => HumanPhysics.fromClock(badOpening, {}, 70, clock),
        "nonnegative integer",
      ) &&
      throwsError(
        () => HumanPhysics.fromClock(external, {}, 70, clock),
        "resolve that anchor",
      ) &&
      calls.length === 0,
  );
  const localWindow: HumanPhysics.Window = HumanPhysics.fromClock(
    local,
    {},
    70,
    clock,
  );
  TestValidator.predicate(
    "both local endpoints read one event list",
    localWindow?.from === 1 && localWindow.to === 2,
  );
  TestValidator.equals("one read services both local endpoints", calls, [
    "events",
  ]);
  const externalWindow: HumanPhysics.Window = HumanPhysics.fromClock(
    external,
    {},
    70,
    clock,
    (): number => {
      calls.push("external");
      return 70.5;
    },
  );
  TestValidator.predicate(
    "resolve the opening before reading closing events",
    externalWindow?.from === 0.5 && externalWindow.to === 1,
  );
  TestValidator.equals(
    "each request materializes its own events in bound order",
    calls,
    ["events", "external", "events"],
  );
}
