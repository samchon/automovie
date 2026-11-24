import type { IAutoMovieResolvedBone } from "@automovie/interface";
import { GymnasticsPalmRise } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `GymnasticsPalmRise.knuckle` is the middle knuckle's offset from the wrist in
 * the hand's own frame.
 *
 * Scenarios:
 *
 * 1. An unturned hand at (1, 1, 0) with its knuckle at (1, 1, 0.08) has the
 *    knuckle 8 cm along its +Z.
 * 2. The same hand turned a quarter about +Y, its knuckle 8 cm along world +X,
 *    still has it 8 cm along its own +Z.
 */
export function test_unit_motions_sport_gymnastics_palm_rise_knuckle(): void {
  const bone = (
    worldPosition: IAutoMovieResolvedBone["worldPosition"],
    worldRotation: IAutoMovieResolvedBone["worldRotation"],
  ): IAutoMovieResolvedBone => ({
    bone: "leftHand",
    localRotation: worldRotation,
    worldPosition,
    worldRotation,
  });
  const level: IAutoMovieResolvedBone["worldRotation"] = { x: 0, y: 0, z: 0, w: 1 };
  const quarter: IAutoMovieResolvedBone["worldRotation"] = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  TestValidator.predicate(
    "in the hand's frame",
    vclose(
      GymnasticsPalmRise.knuckle(
        bone({ x: 1, y: 1, z: 0 }, level),
        bone({ x: 1, y: 1, z: 0.08 }, level),
      ),
      { x: 0, y: 0, z: 0.08 },
      1e-12,
    ) &&
      vclose(
        GymnasticsPalmRise.knuckle(
          bone({ x: 1, y: 1, z: 0 }, quarter),
          bone({ x: 1.08, y: 1, z: 0 }, quarter),
        ),
        { x: 0, y: 0, z: 0.08 },
        1e-12,
      ),
  );
}
