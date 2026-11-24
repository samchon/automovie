import type { IAutoMovieVector3 } from "@automovie/interface";
import { kissPitch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few products and one arctangent, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `kissPitch` is the bow about the body's left axis that turns the mouth's arc
 * about the hip toward a point: the signed angle, in the plane normal to that
 * axis, from the hip-to-mouth direction to the hip-to-point direction, positive
 * forward.
 *
 * Scenarios:
 *
 * 1. A point straight along the hip-to-mouth line needs no bow.
 * 2. Facing +Z with the mouth 0.6 m above the hip, a point 30 degrees forward on
 *    that circle needs a 30-degree bow; one 30 degrees behind needs -30.
 * 3. Facing +X (yaw 90) the forward bow turns toward +X.
 * 4. A point's offset along the bow's axis does not change the bow.
 */
export function test_unit_motions_touch_kiss_pitch(): void {
  const hip: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const mouth: IAutoMovieVector3 = { x: 0, y: 0.6, z: 0 };
  const r: number = (30 * Math.PI) / 180;
  const ahead: IAutoMovieVector3 = {
    x: 0,
    y: 0.6 * Math.cos(r),
    z: 0.6 * Math.sin(r),
  };

  // 1. Along the line.
  TestValidator.predicate(
    "no bow along the line",
    nclose(kissPitch(hip, 0, mouth, { x: 0, y: 1.2, z: 0 }), 0, ROUNDING),
  );

  // 2. Forward and back at yaw 0.
  TestValidator.predicate(
    "30 degrees forward",
    nclose(kissPitch(hip, 0, mouth, ahead), 30, ROUNDING),
  );
  TestValidator.predicate(
    "30 degrees back",
    nclose(kissPitch(hip, 0, mouth, { ...ahead, z: -ahead.z }), -30, ROUNDING),
  );

  // 3. Facing +X.
  TestValidator.predicate(
    "facing +X",
    nclose(
      kissPitch(hip, 90, mouth, { x: ahead.z, y: ahead.y, z: 0 }),
      30,
      ROUNDING,
    ),
  );

  // 4. Along the axis.
  TestValidator.predicate(
    "an offset along the axis",
    nclose(kissPitch(hip, 0, mouth, { ...ahead, x: 0.25 }), 30, ROUNDING),
  );
}
