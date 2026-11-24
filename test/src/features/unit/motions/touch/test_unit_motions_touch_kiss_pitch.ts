import type { IAutoMovieVector3 } from "@automovie/interface";
import { kissPitch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric products, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `kissPitch` is the bow that swings the mouth, on its circle about the hip
 * around the body's left, toward a point: the signed angle, in that circle's
 * plane, from the hip-to-mouth arm to the hip-to-point direction, positive
 * forward.
 *
 * Scenarios, the mouth 0.8 m straight above the hip:
 *
 * 1. Facing +Z (yaw 0), a point 30 degrees forward of vertical is a 30 degree bow,
 *    and one 20 degrees behind is -20.
 * 2. Facing +X (yaw 90), the point 30 degrees toward +X is again a 30 degree bow,
 *    and the point's sideways offset along the axis does not change it.
 */
export function test_unit_motions_touch_kiss_pitch(): void {
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const mouth: IAutoMovieVector3 = { x: 0, y: 1.8, z: 0 };
  const tilted: (
    degrees: number,
    forward: "x" | "z",
    aside: number,
  ) => IAutoMovieVector3 = (
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
    "facing +Z",
    nclose(kissPitch(hip, 0, mouth, tilted(30, "z", 0)), 30, ROUNDING) &&
      nclose(kissPitch(hip, 0, mouth, tilted(-20, "z", 0)), -20, ROUNDING),
  );
  TestValidator.predicate(
    "facing +X",
    nclose(kissPitch(hip, 90, mouth, tilted(30, "x", 0)), 30, ROUNDING) &&
      nclose(kissPitch(hip, 90, mouth, tilted(30, "x", 0.25)), 30, ROUNDING),
  );
}
