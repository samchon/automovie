import type { AutoMovieMotionBound } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanArmTrajectoryClusters,
  HumanArmTrajectorySweepBound,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Four additions at the three-second scale cover the non-dyadic crossing. */
const TIME_ROUNDING: number = 4 * 3 * Number.EPSILON;

/**
 * An arm's clearance screens use every step's travel and a sphere covering
 * every corner of each obstacle part.
 *
 * Scenarios:
 *
 * 1. Backwards frames at elapsed times 0, 2 and 3 travel 4 and 3 metres on
 *    orthogonal axes. Between 0.5 and 2.5 s the bound travels 4.5 metres.
 * 2. From elapsed second 1 a gap of 3 metres first closes at 2 + 1/3 s.
 *    With one frame there is no travel bound.
 * 3. Corners (-1, 0, 0) and (1, 0, 0) bound their part by a radius-one
 *    sphere at the origin. A different part at x = 7 stays separate. A
 *    probe sphere centred at x = 1.08 with radius 0.05 enters the first
 *    part's nominal 0.05-m reach, whereas one at x = 1.12 stays outside.
 */
export function test_unit_motions_posture_arm_clearance_bounds(): void {
  const clock: Parameters<typeof HumanArmTrajectorySweepBound.chords>[0] = {
    times: [1, 2, 4],
  };
  const course: IAutoMovieVector3[] = [
    { x: 4, y: 3, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 0, y: 0, z: 0 },
  ];
  const bound: AutoMovieMotionBound.IPrepared =
    HumanArmTrajectorySweepBound.chords(clock, 2, [2, 1, 0], course)!;
  TestValidator.equals("the elapsed times", bound.times, [0, 2, 3]);
  TestValidator.equals("travel through both chords", bound.travel(0.5, 2.5), 4.5);
  TestValidator.predicate(
    "the first non-certified instant",
    nclose(bound.advance(1, 3), 2 + 1 / 3, TIME_ROUNDING),
  );
  TestValidator.equals(
    "no step yields no bound",
    HumanArmTrajectorySweepBound.chords(clock, 2, [2], [course[0]!]),
    undefined,
  );

  const body: Parameters<typeof HumanArmTrajectoryClusters>[0] = [
    { point: { x: -1, y: 0, z: 0 }, part: 0, corner: 0, bone: "chest" },
    { point: { x: 1, y: 0, z: 0 }, part: 0, corner: 1, bone: "chest" },
    { point: { x: 7, y: 0, z: 0 }, part: 1, corner: 0, bone: "head" },
  ];
  const clusters: HumanArmTrajectoryClusters.ICluster[] =
    HumanArmTrajectoryClusters(body);
  TestValidator.equals("each part's bounding sphere", clusters, [
    { start: 0, end: 2, centre: { x: 0, y: 0, z: 0 }, radius: 1 },
    { start: 2, end: 3, centre: { x: 7, y: 0, z: 0 }, radius: 0 },
  ]);
  TestValidator.predicate(
    "retain potentially close spheres and omit separated spheres",
    HumanArmTrajectoryClusters.reaches(clusters[0]!, { x: 1.08, y: 0, z: 0 }, 0.05) &&
      !HumanArmTrajectoryClusters.reaches(clusters[0]!, { x: 1.12, y: 0, z: 0 }, 0.05),
  );
}
