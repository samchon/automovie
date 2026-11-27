import type {
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  StrikingAim
} from "../../../../../packages/motions/src/striking/internal/StrikingAim";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** The observation step, a film frame, seconds. */
const H: number = 1 / 24;

/** A strike launched at 0 s landing at 0.5 s, corrected 0.11 s late. */
const TIMING: IAutoMovieMotionHumanStrikingAim.ITiming = {
  launch: 0,
  impact: 0.5,
  latency: 0.11,
  step: H,
  shortest: 0.04,
};

/** No offset. */
const NONE: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * `StrikingAim` plans a strike's goal at a first-order prediction of its target
 * at contact (Brenner and Smeets 1996) and superposes a minimum-jerk correction
 * for each later prediction's change (Flash and Henis 1991), one latency after
 * its observation.
 *
 * Scenarios, on a strike launched at 0 s landing at 0.5 s:
 *
 * 1. The observations run a frame apart from the launch to the last whose
 *    correction lasts 0.04 s, `0.5 − 0.11 − 0.04 = 0.35` s: nine of them. A
 *    contact not after the launch is refused.
 * 2. A target at constant velocity is predicted exactly at every observation: the
 *    goal is its contact point and every correction is none, two started by 0.2
 *    s, each running from its start to the contact.
 * 3. A target at `x = t²` is first predicted at `0 + (−h)(0.5) = −h / 2` and then
 *    at `h² + h (0.5 − h) = h / 2`, so the first correction is `h`, and the
 *    goal once it alone has started is `h / 2`; an offset is added to the plan
 *    and not to the corrections.
 */
export function test_motions_striking_aim(): void {
  const times: number[] = StrikingAim.observations(TIMING);
  TestValidator.predicate(
    "nine observations a frame apart",
    times.length === 9 &&
      times.every((t: number, k: number): boolean => nclose(t, k * H, 1e-12)),
  );
  TestValidator.error("a contact before the launch", () =>
    StrikingAim.observations({ ...TIMING, impact: 0 }),
  );

  const steady: IAutoMovieMotionHumanStrikingAim.ITracker = StrikingAim.track(
    (t: number): IAutoMovieVector3 => ({ x: t, y: 0, z: 1 }),
    TIMING,
    NONE,
  );
  const units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[] =
    steady.units(0.2);
  TestValidator.predicate(
    "a steady target is met exactly",
    vclose(steady.planned, { x: 0.5, y: 0, z: 1 }, 1e-12) &&
      vclose(steady.goal(0.5), { x: 0.5, y: 0, z: 1 }, 1e-12) &&
      steady
        .units(0.5)
        .every((unit: IAutoMovieSuperposeMinimumJerk.IUnit): boolean =>
          vclose(unit.displacement, NONE, 1e-12),
        ) &&
      units.length === 2 &&
      nclose(units[0]!.start, H + 0.11, 1e-12) &&
      nclose(units[0]!.duration, 0.5 - H - 0.11, 1e-12) &&
      nclose(units[1]!.start, 2 * H + 0.11, 1e-12),
  );

  const lift: IAutoMovieVector3 = { x: 0, y: 0.1, z: 0 };
  const speeding: IAutoMovieMotionHumanStrikingAim.ITracker = StrikingAim.track(
    (t: number): IAutoMovieVector3 => ({ x: t * t, y: 0, z: 0 }),
    TIMING,
    lift,
  );
  TestValidator.predicate(
    "an accelerating target is corrected",
    vclose(speeding.planned, { x: -H / 2, y: 0.1, z: 0 }, 1e-12) &&
      vclose(
        speeding.units(0.17)[0]!.displacement,
        { x: H, y: 0, z: 0 },
        1e-12,
      ) &&
      speeding.units(0.17).length === 1 &&
      vclose(speeding.goal(0.17), { x: H / 2, y: 0.1, z: 0 }, 1e-12),
  );
}
