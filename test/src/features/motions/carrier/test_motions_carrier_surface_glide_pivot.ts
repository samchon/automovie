import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  measureSurfaceGlide
} from "../../../../../packages/motions/src/carrier/internal/measureSurfaceGlide";
import {
  pivotSurfaceFoot
} from "../../../../../packages/motions/src/carrier/internal/pivotSurfaceFoot";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check a glide's displacement and an anchored skate-foot turn.
 *
 * Scenarios:
 *
 * 1. On level snow with headings along +Z, read 1 m forward, 0.1 m sideways
 *    and 0.02 m above the plane. Refuse a zero normal or a vertically
 *    pointing ski.
 * 2. Turn a foot by 90 degrees around a point 0.2 m ahead of its ankle. The
 *    ankle and bend move while the world support is held.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios describe the measured axes, inadmissible geometry and fixed pivot anchor.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture checks direction, gap and invalid geometry, then reads the point and bend after the pivot.
 * @evidence contracts/development/testing.md#independent-expectations The plane axes give the three displacement components and a quarter turn about the given world point gives the expected ankle and bend.
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
    rotation: AutoMovieEngineQuaternion.identity(),
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
      qclose(turned.rotation!, AutoMovieEngineQuaternion.fromAxisAngle(up, 90), ROUNDING) &&
      turned.contact === support,
  );
}
