import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  HumanRefusal,
  kiss,
  kissClock,
  kissPitch,
  kissProjection,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/** Rounding of a few trigonometric identities, degrees and seconds. */
const ROUNDING: number = 1e-9;

/**
 * The `kiss` law's own logic, each piece without the arm planner:
 *
 * - Contact admits a mouth placement within 5 mm of the named region. A role
 *   in a hand meeting names the back of one hand.
 * - `kissClock` adds the contact events to a phrase: `contact` at its `ready` and
 *   `part` at its `relax`, keeping its length.
 * - `kissPitch` is the bow that swings the mouth on its circle about the hip
 *   around the body's left toward a point: the signed angle in that plane,
 *   positive forward.
 * - `kissProjection` aims the hip-to-mouth vector at a skin point by a roll, then
 *   a pitch, each the inverse sine of the goal's component over the radius it
 *   turns on, less the angle the mouth already makes; none beyond it.
 *
 * Scenarios:
 *
 * 1. Contact at the tolerance edge passes. A greater miss and a hand role
 *    assigned to a cheek refuse on `region`.
 * 2. Clock: a phrase preparing 0.4 s, holding 1 s and retracting 0.4 s makes
 *    contact at 0.4 s and parts at 1.4 s, over 1.8 s.
 * 3. Pitch, the mouth 0.8 m above the hip: facing +Z a point 30 degrees forward is
 *    a 30 degree bow and one 20 behind -20; facing +X the point 30 degrees
 *    toward +X is 30, whatever its offset along the axis.
 * 4. Projection, an upright entry facing +Z, the hip at (0, 1, 0): the mouth aimed
 *    at itself needs no turn; 20 degrees further forward on its circle a 20
 *    degree pitch; a mouth above aimed 15 degrees toward -X a 15 degree roll; a
 *    point 1 m aside none.
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
      error instanceof HumanRefusal && error.kind === "reach" && error.axis === "region",
  );
  assert.equal(kiss.handFor("handBackRight", "kisser"), "right");
  assert.equal(kiss.handFor("handBackLeft", "presenter"), "left");
  assert.equal(kiss.handFor("cheekRight", undefined), undefined);
  assert.throws(
    () => kiss.handFor("cheekRight", "kisser"),
    (error: unknown): boolean =>
      error instanceof HumanRefusal && error.kind === "parameter" && error.axis === "region",
  );

  // 2. Clock.
  const clock: IAutoMovieMotionClock = kissClock(
    AutoMovieMotionClock.phrase({
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
