import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionHumanBalance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPhysics, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Requested balance uses one part and one prepared interval, with
 * Flash–Hogan minimum-jerk easing only on the two requested edges.
 *
 * Scenarios:
 * 1. A recommendation by itself is inactive. An explicit zero weight
 *    still uses no foreign event lookup.
 * 2. A repeated event opens at the second occurrence minus an offset. A
 *    shifted foreign cue closes the interval in the action's local clock.
 *    Explicit part and weight take precedence over the recommended ones.
 * 3. The eased and flat parts match the independent quintic and keep
 *    the audit inactive outside or at zero weight. Repeated, out-of-order
 *    reads never resolve the cue again.
 * 4. Omitted weight and ramp use a unit rectangular window. Oversized
 *    ramps preserve their ratio when squeezed into the same window, even
 *    when the sum of finite requested durations would overflow.
 * 5. An instantaneous square window applies at its one instant. With an
 *    eased edge it applies nowhere and admits no judging window.
 * 6. Missing part and either bound are refused by their balance fields.
 * 7. The correction on a rectangular support is zero inside. Outside,
 *    the closest reachable boundary gives the signed shift, and a line
 *    running parallel to its missed face refuses a projection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the author defaults, action clock, transient and refusal contracts.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises public shift preparation, weight, judgment and support projection. Wrong part precedence, extra lookups, unnecessary audits, ill-named refusals and nonminimal corrections fail.
 * @evidence contracts/development/testing.md#independent-expectations Derives the cue times and compares with the rest-to-rest minimum-jerk polynomial 10u³−15u⁴+6u⁵ from Flash and Hogan 1985. On the rectangular support the nearest boundary or parallel miss follows from its authored axis limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers omission, indexed and foreign events, overrides, non-overlapping and overlapping ramps, missing terms, and reachable, unnecessary and unreachable support corrections.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory unit spec supplies its own action events and cue callback, without solving any body or starting a host.
 */
export function test_human_motion_balance_window(): void {
  const start: number = 8;
  const timing: Parameters<typeof HumanPhysics.prepare>[3] = {
    duration: 8,
    events: [
      { name: "tap", share: 1 / 8 },
      { name: "tap", share: 2 / 8 },
    ],
  };
  const law: HumanPhysics.ILaw = {
    balance: {
      by: "hips",
      weight: 1 / 2,
      from: { event: "tap", index: 1, offset: -1 / 2 },
      to: { of: "other", event: "catch", offset: 1 / 2 },
      ramp: { in: 2, out: 1 },
    },
  };
  let calls: number = 0;
  const resolve: HumanPhysics.Instant = (
    event: AutoMovieMotionHumanScheduledInstant,
  ): number => {
    ++calls;
    TestValidator.predicate(
      "the foreign cue keeps its anchor, event and offset",
      typeof event !== "number" &&
        event.of === "other" &&
        event.event === "catch" &&
        event.offset === 1 / 2,
    );
    return 14 + (typeof event === "number" ? 0 : (event.offset ?? 0));
  };
  TestValidator.predicate(
    "a recommendation or an explicit zero alone does not resolve an event",
    HumanPhysics.prepare({}, law, start, timing, resolve) === null &&
      HumanPhysics.prepare({ balance: { weight: 0 } }, law, start, timing, resolve) === null &&
      calls === 0,
  );
  const strength: number = 3 / 4;
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: { by: "trunk", weight: strength } },
    law,
    start,
    timing,
    resolve,
  );
  // Tap #2 is at 2 s, and the foreign close is at film 14.5 s.
  TestValidator.predicate(
    "the local window opens at 1.5 s and closes at 6.5 s on the trunk",
    window !== null && window.by === "trunk" && window.from === 1.5 && window.to === 6.5,
  );
  const span: HumanPhysics.ISpan = {
    name: "test",
    start,
    entryTime: start,
    end: start + timing.duration,
    plan: { duration: timing.duration, contacts: [], balanceWindow: window },
  };
  check(window, span, 4, strength);
  check(window, span, 2, strength * quintic(1 / 4));
  check(window, span, 6.25, strength * quintic(1 / 4));
  check(window, span, 1.5, 0);
  check(window, span, 6.5, 0);
  check(window, span, 1, 0);
  check(window, span, 7, 0);
  TestValidator.equals("foreign time is resolved once for the prepared window", calls, 1);
  TestValidator.predicate(
    "a staged physical outcome stays judged outside a balance window",
    HumanPhysics.judged({ ...span, law: { physical: true } }, start),
  );

  const bounds: IAutoMovieMotionHumanBalance = {
    by: "hips",
    from: { event: "start" },
    to: { event: "end" },
  };
  const square: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: {} },
    { balance: bounds },
    0,
    timing,
  );
  TestValidator.predicate(
    "default hips, one, and immediate boundaries come from the documented defaults",
    square?.by === "hips" &&
      HumanPhysics.weightAt(square, 0) === 1 &&
      HumanPhysics.weightAt(square, timing.duration) === 1 &&
      HumanPhysics.weightAt(square, timing.duration + 1) === 0,
  );
  const compressed: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: { ...bounds, ramp: { in: 6, out: 10 } } },
    {},
    0,
    timing,
  );
  // The 16 requested seconds fit into eight as a 3 s entry and 5 s exit.
  TestValidator.predicate(
    "overlapping ramps meet at full weight and preserve their durations' ratio",
    nclose(HumanPhysics.weightAt(compressed, 1.5), quintic(1 / 2), Number.EPSILON) &&
      HumanPhysics.weightAt(compressed, 3) === 1 &&
      nclose(HumanPhysics.weightAt(compressed, 5.5), quintic(1 / 2), Number.EPSILON),
  );
  const huge: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: { ...bounds, ramp: { in: Number.MAX_VALUE, out: Number.MAX_VALUE } } },
    {},
    0,
    timing,
  );
  TestValidator.predicate(
    "two equally long finite ramps each fill half the bounded window",
    HumanPhysics.weightAt(huge, 2) === 1 / 2 &&
      HumanPhysics.weightAt(huge, 4) === 1 &&
      HumanPhysics.weightAt(huge, 6) === 1 / 2,
  );
  const sameBound: IAutoMovieMotionHumanBalance = { ...bounds, to: bounds.from };
  const instant: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: sameBound },
    {},
    0,
    timing,
  );
  TestValidator.predicate(
    "an instant can take full square weight, but there is no time to ease it",
    HumanPhysics.weightAt(instant, 0) === 1 &&
      HumanPhysics.weightAt(instant, 1) === 0 &&
      HumanPhysics.prepare(
        { balance: { ...sameBound, ramp: { in: 1, out: 0 } } },
        {},
        0,
        timing,
      ) === null,
  );
  for (const field of ["by", "from", "to"] as const) {
    const incomplete: IAutoMovieMotionHumanBalance = { ...bounds };
    delete incomplete[field];
    let axis: string | undefined;
    try {
      HumanPhysics.prepare({ balance: incomplete }, {}, 0, timing);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.kind !== "parameter") throw error;
      axis = error.axis;
    }
    TestValidator.equals(`the missing ${field} names its axis`, axis, `balance.${field}`);
  }
  supportOffset();
}

/** The closest point on an authored axis-aligned support is known exactly. */
function supportOffset(): void {
  const lo: number = -1;
  const hi: number = 2;
  const z: number = 1 / 2;
  const points: IAutoMovieVector3[] = [
    { x: hi, y: 0, z },
    { x: lo, y: 0, z: -z },
    { x: hi, y: 0, z: -z },
    { x: lo, y: 0, z },
  ];
  const towardX: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const towardZ: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const inside: IAutoMovieMotionHumanBalance.ISupport = {
    centre: { x: hi - 1 / 4, y: 1, z: z / 2 },
    points,
  };
  const outside: IAutoMovieMotionHumanBalance.ISupport = {
    centre: { ...inside.centre, x: hi + 3 / 2 },
    points,
  };
  TestValidator.predicate(
    "support projection moves only to the closest reachable boundary",
    HumanPhysics.supportOffset(inside, towardX) === 0 &&
      HumanPhysics.supportOffset(outside, towardX) === -3 / 2 &&
      HumanPhysics.supportOffset(outside, { x: -1, y: 0, z: 0 }) === 3 / 2 &&
      HumanPhysics.supportOffset(outside, towardZ) === null,
  );
}

/** The closed form in Flash and Hogan 1985, with normalized time u. */
function quintic(u: number): number {
  return 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
}

/** Compare an actual scalar and the judgment at the same instant. */
function check(
  window: HumanPhysics.Window,
  span: HumanPhysics.ISpan,
  seconds: number,
  expected: number,
): void {
  TestValidator.predicate(
    `action second ${seconds}: weight ${expected} and matching audit demand`,
    nclose(HumanPhysics.weightAt(window, seconds), expected, Number.EPSILON) &&
      HumanPhysics.judged(span, span.start + seconds) === (expected > 0),
  );
}
