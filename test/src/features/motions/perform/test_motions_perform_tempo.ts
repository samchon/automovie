import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
} from "@automovie/interface";
import {
  HumanPerformanceTempo,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/**
 * How far a replanned time scale may stand from its closed form: a quotient and
 * a secant of a few decimal values, far above their rounding.
 */
const SCALE: number = 1e-12;

/**
 * `HumanPerformanceTempo` replans an action slower by the factor its speed
 * refusal names, takes the secant through two refusals of one source where the
 * span grows affinely with the time scale, and refuses with the whole time
 * needed once a source has had its replans; `slower` reads the factor.
 *
 * A synthetic law refuses while the span its motion has at the time scale is
 * short of the span it needs, the refusal's value the span it had and its range
 * minimum the span it needs, in seconds.
 *
 * Scenarios:
 *
 * 1. A span `tempo` s needing 1.5 s is replanned once, at 1.5.
 * 2. A span `0.2 + 0.4 tempo` s needing 1 s refuses at 1 (factor 5/3), again at
 *    5/3 (span 13/15), and the secant through the two refusals, slope 0.4,
 *    lands at 2, where it is met; the plain factor would stop at 25/13.
 * 3. A span of 0.5 s at any scale needing 1 s, first planned at 2, is replanned
 *    at 4 and 8 and refused on `duration` with the whole time it needs, (8 / 2)
 *    × 2 = 8 times its first.
 * 4. Any other refusal passes through on the first plan.
 * 5. `slower` reads only a positive span's `duration` reach refusal in seconds
 *    asking more time.
 */
export async function test_motions_perform_tempo(): Promise<void> {
  const { context } = await standingPerformanceState();
  const run = (
    had: (tempo: number) => number,
    needs: number,
    first: number = 1,
  ): { tempos: number[]; error?: unknown } => {
    const tempos: number[] = [];
    try {
      HumanPerformanceTempo.plan(
        {
          plan: (
            at: IAutoMovieMotionHumanActionContext,
          ): IAutoMovieMotionHumanActionPlan => {
            const tempo: number = at.tempo ?? 1;
            tempos.push(tempo);
            if (had(tempo) < needs - SCALE) throw refusal(had(tempo), needs);
            return syntheticHumanPlan({ duration: had(tempo) });
          },
        },
        { ...context, tempo: first },
      );
      return { tempos };
    } catch (error) {
      return { tempos, error };
    }
  };

  // 1. Time scaling.
  const scaled = run((tempo: number): number => tempo, 1.5);
  TestValidator.predicate(
    "one replan by the factor",
    scaled.error === undefined &&
      scaled.tempos.length === 2 &&
      Math.abs(scaled.tempos[1]! - 1.5) <= SCALE,
  );

  // 2. The secant.
  const affine = run((tempo: number): number => 0.2 + 0.4 * tempo, 1);
  TestValidator.predicate(
    "the secant through two refusals",
    affine.error === undefined &&
      affine.tempos.length === 3 &&
      Math.abs(affine.tempos[1]! - 5 / 3) <= SCALE &&
      Math.abs(affine.tempos[2]! - 2) <= SCALE,
  );

  // 3. Refused with the whole time.
  const stuck = run((): number => 0.5, 1, 2);
  TestValidator.predicate(
    "refused after its replans",
    stuck.tempos.length === 3 &&
      Math.abs(stuck.tempos[1]! - 4) <= SCALE &&
      Math.abs(stuck.tempos[2]! - 8) <= SCALE &&
      stuck.error instanceof AutoMovieMotionHumanRefusal &&
      stuck.error.axis === "duration" &&
      stuck.error.kind === "reach" &&
      stuck.error.feasible === null &&
      Math.abs(Number(stuck.error.value) - 8) <= SCALE,
  );

  // 4. Another refusal.
  const other: AutoMovieMotionHumanRefusal = new AutoMovieMotionHumanRefusal({
    kind: "parameter",
    axis: "hold",
    value: -1,
    reason: "negative",
    fix: "positive",
  });
  const passed: unknown[] = [];
  try {
    HumanPerformanceTempo.plan(
      {
        plan: (): IAutoMovieMotionHumanActionPlan => {
          passed.push(1);
          throw other;
        },
      },
      { ...context, tempo: 1 },
    );
  } catch (error) {
    passed.push(error);
  }
  TestValidator.predicate(
    "another refusal passes through",
    passed.length === 2 && passed[1] === other,
  );

  // 5. The factor.
  TestValidator.predicate(
    "the factor a refusal asks",
    Math.abs(HumanPerformanceTempo.slower(refusal(0.5, 1.25))! - 2.5) <=
      SCALE &&
      HumanPerformanceTempo.slower(refusal(1, 1)) === undefined &&
      HumanPerformanceTempo.slower(refusal(1.5, 1)) === undefined &&
      HumanPerformanceTempo.slower(refusal(0, 1)) === undefined &&
      HumanPerformanceTempo.slower(refusal(0.5, 1, "m")) === undefined &&
      HumanPerformanceTempo.slower(other) === undefined &&
      HumanPerformanceTempo.slower(new Error("x")) === undefined &&
      HumanPerformanceTempo.slower(
        new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "reach",
          value: 0.5,
          feasible: { kind: "range", minimum: 1, maximum: null, unit: "s" },
          reason: "far",
          fix: "near",
        }),
      ) === undefined,
  );
}

/** A speed refusal that had `had` seconds and needs `needs`. */
function refusal(had: number, needs: number, unit: string = "s"): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: "duration",
    value: had,
    feasible: { kind: "range", minimum: needs, maximum: null, unit },
    reason: "too fast",
    fix: "slower",
  });
}
