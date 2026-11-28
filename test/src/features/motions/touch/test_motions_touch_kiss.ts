import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  kiss
} from "../../../../../packages/motions/src/touch/internal/kiss";
import {
  kissClock
} from "../../../../../packages/motions/src/touch/internal/kissClock";
import {
  kissPitch
} from "../../../../../packages/motions/src/touch/internal/kissPitch";
import {
  kissProjection
} from "../../../../../packages/motions/src/touch/internal/kissProjection";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/** Rounding of a few trigonometric identities, degrees and seconds. */
const ROUNDING: number = 1e-9;

/**
 * Check kiss contact admission, phrase cues and body-plane aiming.
 *
 * Scenarios:
 *
 * 1. Admit the 5 mm contact limit. Refuse a larger gap and assigning a hand
 *    role to a cheek. Map the named hand regions to their sides.
 * 2. A phrase with 0.4 s approach, 1 s hold and 0.4 s return sets contact at
 *    0.4 s and parting at 1.4 s.
 * 3. Check front and rear pitch, changed heading and axis offset. Project
 *    unchanged, pitched and rolled targets, and reject an unreachable lateral
 *    point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify where the tolerance, timed contact and projected angles are measured.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture exercises the contact gate, side selection, phrase clock and separate planar geometry routines.
 * @evidence contracts/development/testing.md#independent-expectations Literal cue sums and constructed circular targets give the expected contact times and signed angles.
 */
export function test_motions_touch_kiss(): void {
  // 1. Contact and roles.
  const at: IAutoMovieMotionHumanKiss.ISolved = {
    pitch: 0, roll: 0, flexion: 0, raise: 0, miss: 0.005,
  };
  kiss.admitReach("cheekRight", at);
  assert.throws(
    () => kiss.admitReach("cheekRight", { ...at, miss: 0.006 }),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal && error.kind === "reach" && error.axis === "region",
  );
  assert.equal(kiss.handFor("handBackRight", "kisser"), "right");
  assert.equal(kiss.handFor("handBackLeft", "presenter"), "left");
  assert.equal(kiss.handFor("cheekRight", undefined), undefined);
  assert.throws(
    () => kiss.handFor("cheekRight", "kisser"),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal && error.kind === "parameter" && error.axis === "region",
  );

  // 2. Clock.
  const clock: IAutoMovieMotionClock = kissClock(
    motionClock.phrase({
      prepare: 0.4,
      attack: 0,
      hold: 1,
      retract: 0.4,
    }),
  );
  TestValidator.predicate(
    "the contact events",
    nclose(clock.duration, 1.8, ROUNDING) &&
      nclose(clock.at("contact"), 0.4, ROUNDING) &&
      nclose(clock.at("part"), 1.4, ROUNDING) &&
      nclose(clock.at("ready"), 0.4, ROUNDING),
  );

  // 3. Pitch.
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const above: IAutoMovieVector3 = { x: 0, y: 1.8, z: 0 };
  const tilted = (
    degrees: number,
    forward: "x" | "z",
    aside: number,
  ): IAutoMovieVector3 => {
    const a: number = (degrees * Math.PI) / 180;
    const ahead: number = 0.6 * Math.sin(a);
    return forward === "z"
      ? { x: aside, y: 1 + 0.6 * Math.cos(a), z: ahead }
      : { x: ahead, y: 1 + 0.6 * Math.cos(a), z: aside };
  };
  TestValidator.predicate(
    "the bows",
    nclose(kissPitch(hip, 0, above, tilted(30, "z", 0)), 30, ROUNDING) &&
      nclose(kissPitch(hip, 0, above, tilted(-20, "z", 0)), -20, ROUNDING) &&
      nclose(kissPitch(hip, 90, above, tilted(30, "x", 0)), 30, ROUNDING) &&
      nclose(kissPitch(hip, 90, above, tilted(30, "x", 0.25)), 30, ROUNDING),
  );

  // 4. Projection.
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const ahead: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0.1 };
  const still: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    ahead,
    ahead,
  );
  const radius: number = Math.hypot(0.6, 0.1);
  const angle: number = Math.atan2(0.1, 0.6) + (20 * Math.PI) / 180;
  const pitched: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    ahead,
    { x: 0, y: 1 + radius * Math.cos(angle), z: radius * Math.sin(angle) },
  );
  const tilt: number = (15 * Math.PI) / 180;
  const rolled: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    { x: 0, y: 1.6, z: 0 },
    { x: -0.6 * Math.sin(tilt), y: 1 + 0.6 * Math.cos(tilt), z: 0 },
  );
  TestValidator.predicate(
    "the projections",
    still !== null &&
      nclose(still.pitch, 0, ROUNDING) &&
      nclose(still.roll, 0, ROUNDING) &&
      pitched !== null &&
      nclose(pitched.pitch, 20, ROUNDING) &&
      nclose(pitched.roll, 0, ROUNDING) &&
      rolled !== null &&
      nclose(rolled.roll, 15, ROUNDING) &&
      nclose(rolled.pitch, 0, ROUNDING) &&
      kissProjection(entry, hip, ahead, { x: 1, y: 1, z: 0 }) === null,
  );
}
