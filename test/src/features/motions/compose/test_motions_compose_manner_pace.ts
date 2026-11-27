import { AutoMovieEngineRandom } from "@automovie/engine";

import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieRandom,
} from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import {
  HumanSkill
} from "../../../../../packages/motions/src/skill/internal/HumanSkill";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few products and sums of seconds. */
const ROUNDING: number = 1e-12;

/** The step of the central difference a rate is read by, seconds. */
const H: number = 1e-6;

/**
 * Agreement of two central differences of the clock's smooth progress: the
 * truncation, h² over six of its third derivative, and the rounding, ε over h,
 * are both far below it.
 */
const DIFFERENCE: number = 1e-6;

/**
 * A stream that is never read: every manner here has no variation, so `resolve`
 * draws nothing from it.
 */
const UNREAD: IAutoMovieRandom = {
  seed: "unread",
  block: (): [number, number, number, number] => [0, 0, 0, 0],
  uint32: (): number => 0,
  float: (): number => 0.5,
  stream: (): IAutoMovieRandom => UNREAD,
};

/**
 * A manner's time scaling: `motionManner.resolve` turns a pace into
 * the tempo `Effort.tempo / pace`, Laban's Time Effort giving `1 − 0.3 time`,
 * and a hold factor `tempo (1 + 0.3 flow)`; `time` stretches the action's clock
 * span by span. Played at a pace, an action keeps its instants' names and
 * order, so its contacts and plants keep their phase, every instant moves to
 * its second times the tempo, and a quantity read at equal phase is equal and
 * changes at the rate divided by the tempo (the chain rule).
 *
 * A clock (`motionClock`) of 3 s with instants `lift` at 1 s, `plant`
 * at 2 s.
 *
 * Scenarios:
 *
 * 1. Pace 2 resolves to tempo and hold 0.5; pace 1 to 1.
 * 2. Played at pace 2 the clock lasts 1.5 s, `lift` at 0.5 s and `plant` at 1 s,
 *    the names in order.
 * 3. Its progress from `lift` to `plant` at equal phase is equal, and its rate
 *    there is doubled.
 * 4. The weary preset (time −0.7, flow 0.3, pace 0.8) resolves to tempo 1.21 / 0.8
 *    = 1.5125, the 1.51 times the time it cites, and hold 1.5125 · 1.09; its
 *    clock keeps every instant's name and order.
 * 5. A performer with elite timing and novice path skill has separate tempo and
 *    extent spreads. Explicit consistency replaces both spreads.
 */
export function test_motions_compose_manner_pace(): void {
  const clock: IAutoMovieMotionClock = motionClock(3, [
    { name: "lift", seconds: 1 },
    { name: "plant", seconds: 2 },
  ]);
  const names = (c: IAutoMovieMotionClock): string[] =>
    c.instants.map((i: IAutoMovieMotionClockInstant): string => i.name);

  // 1. The tempo of a pace.
  const fast: ReturnType<typeof motionManner.resolve> =
    motionManner.resolve({ pace: 2 }, UNREAD);
  const usual: ReturnType<typeof motionManner.resolve> =
    motionManner.resolve({ pace: 1 }, UNREAD);
  TestValidator.predicate(
    "a pace's tempo",
    nclose(fast.tempo, 0.5, ROUNDING) &&
      nclose(fast.hold, 0.5, ROUNDING) &&
      nclose(usual.tempo, 1, ROUNDING),
  );

  // 2. The scaled clock.
  const played: IAutoMovieMotionClock = motionManner.time(
    clock,
    fast,
    {
      holds: [],
    },
  );
  TestValidator.predicate(
    "the instants at half their seconds, in order",
    nclose(played.duration, 1.5, ROUNDING) &&
      nclose(played.at("lift"), 0.5, ROUNDING) &&
      nclose(played.at("plant"), 1, ROUNDING) &&
      names(played).join() === names(clock).join(),
  );

  // 3. Equal phase, doubled rate.
  const progress = (c: IAutoMovieMotionClock, t: number): number =>
    c.progress("lift", "plant", t);
  const rate = (c: IAutoMovieMotionClock, t: number): number =>
    (progress(c, t + H) - progress(c, t - H)) / (2 * H);
  TestValidator.predicate(
    "equal phase and the chain rule",
    [1.25, 1.5, 1.75].every(
      (t: number): boolean =>
        nclose(progress(played, t / 2), progress(clock, t), ROUNDING) &&
        nclose(rate(played, t / 2), 2 * rate(clock, t), DIFFERENCE),
    ),
  );

  // 4. The weary preset.
  const weary: ReturnType<typeof motionManner.resolve> =
    motionManner.resolve(motionManner.PRESETS.weary, UNREAD);
  TestValidator.predicate(
    "weary's tempo and hold, its instants kept",
    nclose(weary.tempo, 1.21 / 0.8, ROUNDING) &&
      nclose(weary.hold, (1.21 / 0.8) * 1.09, ROUNDING) &&
      names(motionManner.time(clock, weary)).join() ===
        names(clock).join(),
  );

  const random: IAutoMovieRandom = AutoMovieEngineRandom.createRandom("manner-axes");
  const context: Parameters<typeof motionManner>[0] = {
    skill: HumanSkill.resolve(
      { level: "trained", axes: { timing: 1, path: 0 } },
      "manner-axes",
    ),
    random: (): IAutoMovieRandom => random,
  };
  const varied: ReturnType<typeof motionManner> =
    motionManner(context, { variation: 1 });
  const consistent: ReturnType<typeof motionManner> =
    motionManner(context, { variation: 1, consistency: 1 });
  const tempo: number = 1 + 0.05 * (2 * random.float(0) - 1);
  const extent: number = 2 * random.float(1) - 1;
  TestValidator.predicate(
    "timing controls tempo and path controls extent until explicitly overridden",
    nclose(varied.tempo, tempo, ROUNDING) &&
      nclose(varied.extent, 1 + 0.2 * extent, ROUNDING) &&
      nclose(consistent.tempo, tempo, ROUNDING) &&
      nclose(consistent.extent, 1 + 0.08 * extent, ROUNDING),
  );
}
