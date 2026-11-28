import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { motionHumanFrame } from "../../internal/motionHumanFrame";
import { motionHumanLaw } from "../../internal/motionHumanLaw";
import { motionHumanLawCovering } from "../../internal/motionHumanLawCovering";
import { motionHumanRepeat } from "../../internal/motionHumanRepeat";

/**
 * Repeatability checks admit finite displays, ignore quaternion sign and reject
 * nonfinite positions and sample clocks. Film reads and coverage partitions
 * reject invalid clocks and part numbers before using them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the world-position and quaternion comparisons, finite film clocks and safe integer partition inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the maintained comparisons on typed one-bone films, records frame queries and exercises real covering partition selection and refusal.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's quarter-turn quaternion has an opposite-sign representation of the same orientation. A 1e-9 m displacement is admitted and 2e-9 m differs. A four-Hz one-second film has five ticks. One body and two seeds require one cell per ordinal part; the two selected seeds must differ.
 */
export async function test_motions_audit_human_repeat_finite(): Promise<void> {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const turn: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const opposite: IAutoMovieQuaternion = {
    x: 0,
    y: -Math.SQRT1_2,
    z: 0,
    w: -Math.SQRT1_2,
  };
  const calls: number[] = [];
  const initial = film(origin, turn, 1, (seconds) => calls.push(seconds));
  assert.deepEqual(
    motionHumanRepeat(initial, film({ ...origin, x: 1e-9 }, opposite), "a", 4),
    [],
  );
  assert.deepEqual(calls, [1, 0.75, 0.5, 0.25, 0]);
  const difference = motionHumanRepeat(
    initial,
    film({ ...origin, x: 2e-9 }, turn),
    "a",
    4,
  );
  assert.equal(difference.length, 5);
  assert(difference.every((finding) => finding.includes("position 2e-9 m")));
  const identity: IAutoMovieQuaternion = { ...origin, w: 1 };
  assert.deepEqual(
    motionHumanRepeat(
      film(origin, identity, 0),
      film(origin, { ...identity, x: 1e-9 }, 0),
      "a",
      4,
    ),
    [],
  );
  const angular = motionHumanRepeat(
    film(origin, identity, 0),
    film(origin, { ...identity, x: 2e-9 }, 0),
    "a",
    4,
  );
  assert.equal(angular.length, 1);
  assert.match(angular[0]!, /rotation chord 2e-9/u);

  const resting = film(origin, turn, 0);
  assert.deepEqual(
    motionHumanRepeat(resting, film(origin, opposite, 0), "a", 4),
    [],
  );
  assert.equal(
    motionHumanRepeat(
      film({ ...origin, x: Number.MAX_VALUE }, turn, 0),
      film({ ...origin, x: -Number.MAX_VALUE }, turn, 0),
      "a",
      4,
    ).length,
    1,
  );
  assert.doesNotThrow(() =>
    motionHumanFrame(
      film(origin, { ...origin, w: 1 + 5e-7 }).bones("a", 0),
      "control",
    ),
  );
  assert.throws(
    () =>
      motionHumanFrame(
        film(origin, { ...origin, w: 1 + 2e-6 }).bones("a", 0),
        "control",
      ),
    /world rotation/u,
  );

  for (const axis of ["x", "y", "z"] as const)
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      const bad = film({ ...origin, [axis]: value }, turn);
      const error = new RegExp(`hips: a nonfinite world position ${axis}`, "u");
      assert.throws(
        () => motionHumanFrame(bad.bones("a", 0), "bad frame"),
        error,
      );
      assert.throws(() => motionHumanRepeat(initial, bad, "a", 4), error);
    }

  const observed = calls.length;
  for (const value of [Number.NaN, Infinity, -Infinity]) {
    assert.throws(
      () => motionHumanRepeat(initial, film(origin, turn, value), "a", 4),
      /finite durations/u,
    );
    assert.throws(
      () => motionHumanRepeat(film(origin, turn, value), initial, "a", 4),
      /finite durations/u,
    );
    assert.throws(
      () => motionHumanRepeat(initial, initial, "a", value),
      /finite positive sample rate/u,
    );
  }
  assert.equal(calls.length, observed);
  filmAdmission();
  await partitionAdmission();
}

/** A single known displayed bone and a caller-observable sample clock. */
function film(
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  duration: number = 1,
  read?: (seconds: number) => void,
): IAutoMovieMotionHumanAuditMotion {
  return {
    duration,
    bones: (_subject, seconds) => {
      read?.(seconds);
      return new Map([
        [
          "hips",
          {
            bone: "hips",
            localRotation: { x: 0, y: 0, z: 0, w: 1 },
            worldPosition: position,
            worldRotation: rotation,
          },
        ],
      ]);
    },
    segments: () => [],
  };
}

/** Film admission owns finite clocks before delegating a bone read. */
function filmAdmission(): void {
  const p: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const q: IAutoMovieQuaternion = { ...p, w: 1 };
  const reads: number[] = [];
  const source = film(p, q, 1, (seconds) => reads.push(seconds));
  const performance = source as IAutoMovieMotionHumanPerformance;
  const checked = motionHumanLaw.film(performance);
  assert.equal(checked.duration, 1);
  const first = checked.bones("a", 0);
  assert.equal(checked.bones("a", 0), first, "same admitted frame is reused");
  checked.bones("a", 1);
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(
      () => motionHumanLaw.film({ ...performance, duration: value }),
      /invalid film duration/u,
    );
    assert.throws(
      () => checked.bones("a", value),
      /a has nonfinite film second/u,
    );
  }
  assert.throws(
    () => motionHumanLaw.film({ ...performance, duration: -1 }),
    /invalid film duration/u,
  );
  assert.equal(
    motionHumanLaw.film({ ...performance, duration: 0 }).duration,
    0,
  );
  assert.deepEqual(reads, [0, 1]);
}

/** Equal cardinality seeds require the two independent valid ordinal shards. */
async function partitionAdmission(): Promise<void> {
  const stages = {
    partition: (): never => {
      throw new Error("partition stage reached");
    },
  };
  const bodies = ["f-small"] as const;
  const seeds = ["first", "second"];
  for (const at of [
    [0.5, 2],
    [0, 1.5],
    [0, 2 ** 54],
    [2 ** 53, 2 ** 54],
    [Infinity, 2],
    [NaN, 2],
    [0, Infinity],
    [0, 0],
    [2, 2],
  ] as const)
    await assert.rejects(
      motionHumanLawCovering.part(stages, at, bodies, seeds),
      /cannot be cut over 1 bodies/u,
    );

  const even = await motionHumanLawCovering.part(stages, [0, 2], bodies, seeds);
  const odd = await motionHumanLawCovering.part(stages, [1, 2], bodies, seeds);
  assert.equal(even.length, 1);
  assert.equal(odd.length, 1);
  assert(even[0]!.includes(" | refused: partition stage reached"));
  assert(odd[0]!.includes(" | refused: partition stage reached"));
  assert.deepEqual(
    [even[0]!.split(" | ")[3]!, odd[0]!.split(" | ")[3]!].sort(),
    seeds,
  );
}
