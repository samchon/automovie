import { AutoMovieEngineQuaternion } from "@automovie/engine";
import {
  HumanHandoverUpright
} from "../../../../../packages/motions/src/handling/internal/HumanHandoverUpright";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-6;

/**
 * `HumanHandoverUpright.angle` reads how far a reached hand rotation tips what
 * an asked one holds upright: the angle the error `reached * asked^-1` turns
 * the world's up through; infinite when either is absent.
 *
 * Scenarios, an asked rotation 40 degrees about +Y:
 *
 * 1. Reached exactly: 0.
 * 2. Reached with a further 30 degrees about +Y, a turn about up: 0.
 * 3. Reached with a further 25 degrees about +X: 25.
 * 4. Nothing reached: infinite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines carried-object tilt from how the relative hand rotation moves world up, including absent rotations.
 * @evidence contracts/development/testing.md#behavioral-verification Compares one requested yaw with exact reach, extra yaw, extra pitch and an absent reach.
 * @evidence contracts/development/testing.md#independent-expectations World up is invariant under yaw, so the first two reads give zero. An extra 25° x rotation gives 25°, and a missing operand yields infinity.
 */
export function test_motions_handling_human_handover_upright_angle(): void {
  const asked = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 40);
  const after = (axis: { x: number; y: number; z: number }, degrees: number) =>
    AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.fromAxisAngle(axis, degrees), asked);
  TestValidator.predicate(
    "the tips",
    nclose(HumanHandoverUpright.angle(asked, asked), 0, ROUNDING) &&
      nclose(
        HumanHandoverUpright.angle(asked, after({ x: 0, y: 1, z: 0 }, 30)),
        0,
        ROUNDING,
      ) &&
      nclose(
        HumanHandoverUpright.angle(asked, after({ x: 1, y: 0, z: 0 }, 25)),
        25,
        ROUNDING,
      ) &&
      HumanHandoverUpright.angle(asked, undefined) === Infinity,
  );
}
