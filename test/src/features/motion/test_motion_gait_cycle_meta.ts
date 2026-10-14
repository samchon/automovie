import {
  arrangeMotion,
  followPathMotion,
  gaitMotion,
  holdMotion,
  sequenceMotion,
  travelMotion,
} from "@automovie/engine";
import { IAutoMovieGait, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 0.8,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

/** A 1-second cycle-less one-shot (an authored swing). */
const oneShot: () => IAutoMovieMotion = (): IAutoMovieMotion => ({
  ...makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 90 })])),
    ],
    1,
  ),
  skeleton: "h", // match the gait bake so sequence/arrange compose
});

/**
 * The gait-cycle provenance meta (#650): producers that bake or compose a
 * cyclic locomotion stamp `gaitCycle` so a non-looping composite still knows
 * its stride phase, and composition adjusts or honestly drops it.
 *
 * Scenarios:
 *
 * 1. `gaitMotion` stamps `{period, phaseAt: 0}`: the bake is one fresh cycle.
 * 2. `travelMotion` carries the base's cycle; a cycle-less looping base gets one
 *    stamped from its own duration (travel repeats it cyclically).
 * 3. `followPathMotion` carries the gait's cycle metadata.
 * 4. `arrangeMotion` carries the LAST placement's cycle phase-shifted by its start
 *    (`(0 − 2.3) mod 0.8 = 0.1`); a cycle-less final action drops the clock.
 * 5. `sequenceMotion` keeps the clock when every part shares the cycle over whole
 *    cycles, and drops it on a period mismatch or a partial cycle.
 * 6. `holdMotion` carries no cycle at all.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes and composes actual gait, travel, path, arrangement, sequence and hold clips and checks gaitCycle propagation, shifted phase and deliberate clock loss. Carrying an incompatible final/sequence clock or dropping a compatible clock fails the retained metadata observations.
 * @evidence contracts/testing.md#independent-expectations A fresh .8-second cycle starts at phase zero; travel/path preserve that clock and arrangement subtracts its start modulo the period. Sequence continuity requires matching clocks and whole-cycle durations. Literal period/phase expectations use zero-tolerance structural comparison except the retained wrapped-phase nclose; this entry does not observe planted-foot trajectories.
 * @evidence contracts/testing.md#distinguishing-cases Preserves fresh gait metadata, carried/fallback travel clocks, path propagation, shifted/in-range/whole-cycle arranged phases, cycle-less last placement, compatible repetition, period/phase/partial-cycle and first/later missing-clock mismatches, and hold absence. Motion sample values and malformed timeline admission are owned by other entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all composition cases and uses existing local motion fixtures with portable source. It installs no consumer, builds no native artifact, starts no process/browser/GPU and dynamically registers no cases.
 */
export function test_motion_gait_cycle_meta(): void {
  const cycle: IAutoMovieMotion = gaitMotion("walk", "h", WALK, 8);
  TestValidator.predicate("gaitMotion stamps the cycle", equalGeometryTestValues(cycle.gaitCycle, {
    period: 0.8,
    phaseAt: 0,
  }));

  const travel: IAutoMovieMotion = travelMotion("t", cycle, 3, { x: 1, y: 0, z: 0 });
  TestValidator.predicate(
    "travelMotion carries the base cycle",
    equalGeometryTestValues(travel.gaitCycle,
    { period: 0.8, phaseAt: 0 }),
  );
  const bareLoop: IAutoMovieMotion = { ...oneShot(), loop: true };
  TestValidator.predicate(
    "cycle-less base gets stamped from its duration",
    equalGeometryTestValues(travelMotion("t2", bareLoop, 2, { x: 1, y: 0, z: 0 }).gaitCycle,
    { period: 1, phaseAt: 0 }),
  );

  const path: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "p",
    gait: cycle,
    waypoints: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 2 },
    ],
    speed: 1,
  });
  TestValidator.predicate(
    "followPathMotion stamps the cycle",
    equalGeometryTestValues(path.motion.gaitCycle,
    {
      period: 0.8,
      phaseAt: 0,
    }),
  );

  const arrangedWalkLast: IAutoMovieMotion = arrangeMotion("a", [
    { start: 0, motion: oneShot() },
    { start: 2.3, motion: travel },
  ]);
  TestValidator.equals(
    "arrange shifts the last placement's phase by its start",
    namedFacts([
      ["arrangedWalkLastGaitCycle", (): boolean => arrangedWalkLast.gaitCycle !== null],
      [
        "arrangedWalkLastGaitCycle2",
        (): boolean =>
          arrangedWalkLast.gaitCycle !== null &&
          arrangedWalkLast.gaitCycle !== undefined,
      ],
      [
        "ncloseArrangedWalkLastGaitCycle",
        (): boolean =>
          arrangedWalkLast.gaitCycle !== null &&
          arrangedWalkLast.gaitCycle !== undefined &&
          nclose(arrangedWalkLast.gaitCycle.period, 0.8),
      ],
      [
        "ncloseArrangedWalkLastGaitCycle2",
        (): boolean =>
          arrangedWalkLast.gaitCycle !== null &&
          arrangedWalkLast.gaitCycle !== undefined &&
          nclose(arrangedWalkLast.gaitCycle.phaseAt, ((0 - 2.3) % 0.8) + 0.8),
      ],
    ]),
    {
      arrangedWalkLastGaitCycle: true,
      arrangedWalkLastGaitCycle2: true,
      ncloseArrangedWalkLastGaitCycle: true,
      ncloseArrangedWalkLastGaitCycle2: true,
    },
  );
  TestValidator.predicate(
    "an in-range arranged phase stays exact",
    equalGeometryTestValues(arrangeMotion("exact", [
      {
        start: 0,
        motion: { ...travel, gaitCycle: { period: 0.8, phaseAt: 0.4 } },
      },
    ]).gaitCycle,
    { period: 0.8, phaseAt: 0.4 }),
  );
  TestValidator.predicate(
    "a whole-cycle placement keeps the exact phase",
    equalGeometryTestValues(arrangeMotion("whole-cycle", [
      {
        start: 1,
        motion: { ...travel, gaitCycle: { period: 1, phaseAt: 0.4 } },
      },
    ]).gaitCycle,
    { period: 1, phaseAt: 0.4 }),
  );
  const arrangedHoldLast: IAutoMovieMotion = arrangeMotion("a2", [
    { start: 0, motion: travel },
    { start: 3, motion: oneShot() },
  ]);
  TestValidator.equals(
    "a cycle-less last placement drops the clock",
    arrangedHoldLast.gaitCycle,
    null,
  );

  const repeated: IAutoMovieMotion = sequenceMotion("s", [travel, travel]);
  TestValidator.predicate(
    "whole-cycle repetition keeps the clock",
    equalGeometryTestValues(repeated.gaitCycle,
    { period: 0.8, phaseAt: 0 }),
  );
  const otherCycle: IAutoMovieMotion = {
    ...travel,
    gaitCycle: { period: 0.5, phaseAt: 0 },
  };
  TestValidator.equals(
    "a period mismatch drops the clock",
    sequenceMotion("s2", [travel, otherCycle]).gaitCycle,
    null,
  );
  const partial: IAutoMovieMotion = {
    ...travel,
    duration: 1.0, // not a whole multiple of 0.8
  };
  TestValidator.equals(
    "a partial cycle drops the clock",
    sequenceMotion("s3", [partial, partial]).gaitCycle,
    null,
  );
  TestValidator.equals(
    "a cycle-less first part drops the clock",
    sequenceMotion("s4", [oneShot(), travel]).gaitCycle,
    null,
  );
  TestValidator.equals(
    "a cycle-less LATER part drops the clock",
    sequenceMotion("s5", [travel, { ...oneShot(), duration: 0.8 }]).gaitCycle,
    null,
  );
  const shifted: IAutoMovieMotion = {
    ...travel,
    gaitCycle: { period: 0.8, phaseAt: 0.4 },
  };
  TestValidator.equals(
    "a phase mismatch drops the clock",
    sequenceMotion("s6", [travel, shifted]).gaitCycle,
    null,
  );

  TestValidator.equals(
    "holdMotion carries no cycle",
    holdMotion("h", "h", makePose([]), 1).gaitCycle,
    undefined,
  );
}
