import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLean
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanLean";
import {
  humanPostureHeading
} from "../../../../../packages/motions/src/posture/internal/humanPostureHeading";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a few quaternion rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * A bow pitches the trunk about the hips: `AutoMovieMotionHumanLean.tip` adds a
 * forward pitch and moves the root so the hip joint, `root + R h` with h the
 * rest hips, stays where the heading puts it, moved back along the heading by
 * `back`; `bow` without its balance option writes the peak pitch times the
 * clamped weight, on the root and the trunk, the hips still; a peak that is not
 * positive is refused.
 *
 * The body is built whole (`humanFixtureBody`) for its rest hips. The average
 * man stands at (1, 0.9, 2) facing 90 degrees.
 *
 * Scenarios:
 *
 * 1. Tipped 30 degrees, the hip joint stays put and the posture pitches 30.
 * 2. Tipped with 5 cm back, the hip joint moves 5 cm against the heading, to −X.
 * 3. A 40-degree bow at weights 0.5 and 2 pitches 20 and 40 degrees, the hips
 *    still, claiming the root and the trunk.
 * 4. A peak of zero is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hip pivot, heading-relative setback, clamped bow weights and refusal of a zero peak.
 * @evidence contracts/development/testing.md#behavioral-verification Calls HumanLean.tip and bow on an already translated and turned stored body, then reads clinical pitch, hip location and channel claims.
 * @evidence contracts/development/testing.md#independent-expectations A 30-degree tip preserves the pivot. At heading 90 the authored 0.05 m setback subtracts from X. A 40-degree peak multiplied by clamped shares 0.5 and 1 yields 20 and 40 degrees.
 */
export async function test_motions_compose_lean_bow(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 0.9, z: 2 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const hip = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      posture.root,
      AutoMovieEngineQuaternion.rotateVector(
        humanPostureHeading(posture),
        body.rest.get("hips")!,
      ),
    );

  // 1. The pivot.
  const tipped: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
    body,
    standing,
    30,
    0,
  );
  TestValidator.predicate(
    "the hips stay as the trunk pitches",
    tipped.pitch === 30 && vclose(hip(tipped), hip(standing), ROUNDING),
  );

  // 2. Back along the heading.
  TestValidator.predicate(
    "the hips move back along the heading",
    vclose(
      hip(AutoMovieMotionHumanLean.tip(body, standing, 30, 0.05)),
      AutoMovieEngineVector3.add(hip(standing), { x: -0.05, y: 0, z: 0 }),
      ROUNDING,
    ),
  );

  // 3. The bow.
  const bow: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.bow(
    {
      body,
      standing,
      peak: 40,
      from: 0,
      to: 2,
      weight: (seconds: number): number => seconds,
    },
    null,
  );
  const half: IAutoMovieMotionHumanPosture = bow.write(standing, 0.5);
  const full: IAutoMovieMotionHumanPosture = bow.write(standing, 2);
  TestValidator.predicate(
    "the peak times the clamped weight, the hips still",
    half.pitch === 20 &&
      full.pitch === 40 &&
      vclose(hip(full), hip(standing), ROUNDING) &&
      bow.channels.join() === "root,trunk",
  );

  // 4. No peak.
  TestValidator.predicate(
    "a peak of zero is refused",
    throwsError(
      (): unknown =>
        AutoMovieMotionHumanLean.bow(
          { body, standing, peak: 0, from: 0, to: 1, weight: (): number => 1 },
          null,
        ),
      "A bow's peak pitch is positive",
    ),
  );
}
