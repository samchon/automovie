import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRange,
  balletStep,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `balletStep.plan` sets a ballet step on the beat: a position held over its
 * count, a pirouette turning once or twice, a grand jeté; each refused where
 * the dancer's hips cannot reach it.
 *
 * The average man stands at the origin facing +Z, 120 bpm.
 *
 * Scenarios:
 *
 * 1. A first position over four counts takes five beats, `beat1` to `beat5` at a
 *    half second apart, and relaxes on the last.
 * 2. A double pirouette ends turned two whole turns from where it began.
 * 3. A turnout past the hips' external rotation, a sixth position, a triple
 *    pirouette and a split past the hips' flexion and extension together are
 *    each refused.
 */
export async function test_unit_motions_exercise_ballet_plan(): Promise<void> {
  // Whole body: the feet are turned out on the body's own soles and the hips
  // ride over them.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanBallet.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    balletStep.plan(motionActionContext(body, params));
  const first: IAutoMovieMotionHumanActionPlan = plan({ kind: "position" });
  const beat = (k: number): number | undefined => {
    const e: IAutoMovieMotionEvent | undefined = first.events.find(
      (x: IAutoMovieMotionEvent): boolean => x.name === `beat${k}`,
    );
    return e === undefined ? undefined : e.share * first.duration;
  };
  TestValidator.predicate(
    "a position over its count",
    [1, 2, 3, 4, 5].every((k: number): boolean =>
      nclose(beat(k) ?? NaN, 0.5 * k, 1e-9),
    ) && beat(6) === undefined,
  );

  const double: IAutoMovieMotionHumanActionPlan = plan({
    kind: "pirouette",
    turns: 2,
  });
  TestValidator.predicate(
    "two turns",
    nclose(
      Math.abs(double.posture(double.duration).yaw - double.posture(0).yaw),
      720,
      1e-6,
    ),
  );

  const outward: number = Math.min(
    AutoMovieMotionHumanRange.limit("leftUpperLeg", "external") ?? 0,
    AutoMovieMotionHumanRange.limit("rightUpperLeg", "external") ?? 0,
  );
  TestValidator.predicate(
    "beyond the hips",
    throwsError(() => plan({ kind: "position", turnout: outward + 1 })) &&
      throwsError(() => plan({ kind: "position", position: 6 })) &&
      throwsError(() => plan({ kind: "pirouette", turns: 3 })) &&
      throwsError(() => plan({ kind: "grandJete", split: 400 })),
  );
}
