import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  measureSurfaceGlide,
  pivotSurfaceFoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * Two glide helpers: `measureSurfaceGlide` reads a gliding equipment's
 * displacement along the bisector of its two headings in the surface's plane,
 * across it, and its last height off the plane; `pivotSurfaceFoot` turns a foot
 * goal about a foot-local support, keeping that point fixed in the world.
 *
 * Scenarios:
 *
 * 1. A ski moving 1 m along +Z and 0.1 m along +X on level snow, both samples
 *    pointing +Z and the last 0.02 m above the snow, reads 1 along, 0.1 across
 *    (the normal crossed with the forward, +X) and a 0.02 gap.
 * 2. A plane with no normal and a ski pointing straight up are refused.
 * 3. A foot facing +Z turned 90 degrees about Y around a support 0.2 m ahead of
 *    its ankle keeps that support where it was: the ankle moves 0.2 m along -X
 *    and 0.2 m ahead, the bend with it, and the support is recorded.
 */
export function test_motions_carrier_surface_glide_pivot(): void {
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const ahead: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const glide: ReturnType<typeof measureSurfaceGlide> = measureSurfaceGlide(
    { point: { x: 0, y: 0, z: 0 }, forward: ahead },
    { point: { x: 0.1, y: 0.02, z: 1 }, forward: ahead },
    { point: { x: 0, y: 0, z: 0 }, normal: up },
  );
  TestValidator.predicate(
    "the glide",
    nclose(glide.along, 1, ROUNDING) &&
      nclose(glide.across, 0.1, ROUNDING) &&
      nclose(glide.gap, 0.02, ROUNDING),
  );
  TestValidator.error("no normal", (): void => {
    measureSurfaceGlide(
      { point: { x: 0, y: 0, z: 0 }, forward: ahead },
      { point: { x: 0, y: 0, z: 1 }, forward: ahead },
      { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 0 } },
    );
  });
  TestValidator.error("pointing up", (): void => {
    measureSurfaceGlide(
      { point: { x: 0, y: 0, z: 0 }, forward: up },
      { point: { x: 0, y: 0, z: 1 }, forward: up },
      { point: { x: 0, y: 0, z: 0 }, normal: up },
    );
  });
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 0.08, z: 0 },
    bend: { x: 0, y: 0.5, z: 0.1 },
    rotation: Quaternion.identity(),
  };
  const support: IAutoMovieVector3 = { x: 0, y: 0, z: 0.2 };
  const turned: IAutoMovieHumanLimbGoal = pivotSurfaceFoot(
    goal,
    support,
    up,
    90,
  );
  TestValidator.predicate(
    "the pivot",
    vclose(turned.point, { x: -0.2, y: 0.08, z: 0.2 }, ROUNDING) &&
      vclose(turned.bend, { x: -0.2, y: 0.5, z: 0.3 }, ROUNDING) &&
      qclose(turned.rotation!, Quaternion.fromAxisAngle(up, 90), ROUNDING) &&
      turned.contact === support,
  );
}
