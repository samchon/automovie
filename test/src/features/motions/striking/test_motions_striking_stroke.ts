import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanStrikingStroke } from "@automovie/interface";
import { StrikingStroke } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * A strike from the origin to (1, 0, 0) along +X, launched at 0, hitting at 0.5
 * s.
 */
const DELIVERY: IAutoMovieMotionHumanStrikingStroke.IDelivery = {
  origin: { x: 0, y: 0, z: 0 },
  impact: { x: 1, y: 0, z: 0 },
  direction: { x: 1, y: 0, z: 0 },
  launch: 0,
  contact: 0.5,
  speed: 1,
};

/** One unit to (1, 0, 0) over a second, hitting at 1 s, recoiling over 0.5 s. */
const INPUT: IAutoMovieMotionHumanStrikingStroke.IInput = {
  origin: { x: 0, y: 0, z: 0 },
  units: [{ displacement: { x: 1, y: 0, z: 0 }, start: 0, duration: 1 }],
  contact: 1,
  back: () => ({ x: 0, y: 0, z: 0 }),
  recoil: 0.5,
};

/**
 * A striking stroke (`StrikingStroke`): the impact share at which a
 * minimum-jerk unit runs at a share of its peak speed (`16 u² (1 - u)² =
 * speed`); a delivery aimed through the impact so the unit meets it at that
 * share, shortened to a peak speed, through a via point on an overlapping unit,
 * and corrected onto the impact; and the stroke's path, recoiling from the
 * contact straight or through a re-chamber point, and from a resolved stop
 * after a dwell.
 *
 * Scenarios:
 *
 * 1. At full speed the share is ½; at a quarter of the peak it is (1 + sqrt ½) /
 *    2, where the unit's speed is a quarter of its peak; none or more than all
 *    is refused.
 * 2. At full speed the delivery runs one unit twice the reach over twice the time,
 *    meeting the impact at the contact; capped at 4 m/s it starts at 0.03125 s
 *    and lasts 0.9375 s; through a via at (0, 1, 0) it adds the via's unit and
 *    a correction onto the impact; ending before it begins is refused.
 * 3. The path runs out to (1, 0, 0) and back over the recoil, or out through a
 *    re-chamber at (0, 1, 0); stopped at 0.6 s it recoils from where it met,
 *    after the 15 ms dwell.
 * 4. A fixed recovery reads the same free path and stopped path at the same
 *    seconds in reverse order, without asking for the return point again.
 */
export function test_motions_striking_stroke(): void {
  const quarter: number = StrikingStroke.impactShare(0.25);
  TestValidator.predicate(
    "the impact share",
    nclose(StrikingStroke.impactShare(1), 0.5, 1e-12) &&
      nclose(quarter, (1 + Math.SQRT1_2) / 2, 1e-12) &&
      nclose(16 * quarter ** 2 * (1 - quarter) ** 2, 0.25, 1e-12) &&
      throwsError(() => StrikingStroke.impactShare(0)) &&
      throwsError(() => StrikingStroke.impactShare(1.5)),
  );
  TestValidator.equals("one unit", StrikingStroke.delivery(DELIVERY), [
    { displacement: { x: 2, y: 0, z: 0 }, start: 0, duration: 1 },
  ]);
  TestValidator.equals(
    "capped",
    StrikingStroke.delivery({ ...DELIVERY, peak: 4 }),
    [{ displacement: { x: 2, y: 0, z: 0 }, start: 0.03125, duration: 0.9375 }],
  );
  const via = StrikingStroke.delivery({
    ...DELIVERY,
    via: { point: { x: 0, y: 1, z: 0 }, begin: 0, end: 0.2, overlap: 0.05 },
  });
  const r: number = Math.SQRT2;
  TestValidator.predicate(
    "via a point",
    via.length === 3 &&
      vclose(via[0]!.displacement, { x: 0, y: 1, z: 0 }, 1e-12) &&
      vclose(via[1]!.displacement, { x: 1 + r, y: -1, z: 0 }, 1e-12) &&
      nclose(via[1]!.start, 0.15, 1e-12) &&
      nclose(via[1]!.duration, 0.7, 1e-12) &&
      vclose(via[2]!.displacement, { x: (1 - r) / 2, y: -0.5, z: 0 }, 1e-12) &&
      nclose(via[2]!.duration, 0.35, 1e-12) &&
      throwsError(() => StrikingStroke.delivery({ ...DELIVERY, contact: 0 })),
  );
  const straight = StrikingStroke.create(INPUT);
  const rechambered = StrikingStroke.create({
    ...INPUT,
    rechamber: { x: 0, y: 1, z: 0 },
  });
  TestValidator.predicate(
    "out and back",
    vclose(straight.free(0.5), { x: 0.5, y: 0, z: 0 }, 1e-12) &&
      vclose(straight.free(1.25), { x: 0.5, y: 0, z: 0 }, 1e-12) &&
      vclose(straight.free(2), { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(rechambered.free(1.1125), { x: 0.5, y: 0.5, z: 0 }, 1e-12) &&
      vclose(rechambered.free(2), { x: 0, y: 0, z: 0 }, 1e-12),
  );
  const stopped = StrikingStroke.create({ ...INPUT, fixed: 0.6 });
  const met: number = AutoMovieEngineMotionSampling.minimumJerkShare(0.6);
  TestValidator.predicate(
    "a resolved stop",
    StrikingStroke.DWELL === 0.015 &&
      stopped.stop(0.5) === undefined &&
      stopped.stop(0.7) === 0.6 &&
      vclose(stopped.end(0.615), { x: met, y: 0, z: 0 }, 1e-12) &&
      vclose(stopped.end(0.865), { x: met / 2, y: 0, z: 0 }, 1e-12),
  );
  const prepared: IAutoMovieMotionHumanStrikingStroke.IStroke =
    StrikingStroke.create(
      {
        ...INPUT,
        fixed: 0.6,
        back: () => {
          throw new Error("the prepared recovery already has its return point");
        },
      },
      INPUT.back(),
    );
  TestValidator.predicate(
    "prepared recovery at and between boundaries",
    [1.49, 0.865, 0.615, 0.6, 0.41, 0.865].every(
      (seconds: number): boolean =>
        vclose(prepared.free(seconds), stopped.free(seconds), 1e-12) &&
        vclose(prepared.end(seconds), stopped.end(seconds), 1e-12),
    ),
  );
}
