import type {
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";
import {
  HumanColliders
} from "../../../../../packages/motions/src/posture/internal/HumanColliders";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a square root, metres. */
const ROUNDING: number = 1e-12;

/** A shape's identity and placement, its kind aside. */
const BASE: Pick<IAutoMoviePhysicalShape, "id" | "material" | "transform"> = {
  id: "s",
  material: "skin",
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
};

/**
 * `HumanColliders.bound` is the sphere about a collider's centre that contains
 * it, the screen a distance query passes a far shape over with: a sphere's own
 * radius, a capsule's half length plus its radius, a box's half diagonal, a
 * hull's vertex radius about its vertex mean.
 *
 * Scenarios:
 *
 * 1. A sphere of 0.1 m: radius 0.1 about the origin.
 * 2. A capsule of radius 0.05 and half length 0.2: radius 0.25.
 * 3. A box of half extents (0.1, 0.2, 0.2): radius 0.3, the half diagonal.
 * 4. The corner tetrahedron of edge 0.2: centre (0.05, 0.05, 0.05), radius to its
 *    farthest vertex √0.0275.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a conservative bounding sphere in the collider's own frame by shape kind.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the bounding helper on sphere, capsule, box and tetrahedron inputs with fixed dimensions.
 * @evidence contracts/development/testing.md#independent-expectations Capsule radius is 0.05 + 0.2 = 0.25 m, box half-diagonal is 0.3 m, and direct tetrahedron centroid/distance give radius √0.0275.
 */
export function test_motions_posture_collider_bound(): void {
  const sphere: IAutoMovieMotionHumanColliders.IBall = HumanColliders.bound({
    ...BASE,
    kind: "sphere",
    radius: 0.1,
  });
  TestValidator.predicate(
    "a sphere's own",
    sphere.radius === 0.1 && vclose(sphere.centre, { x: 0, y: 0, z: 0 }, 0),
  );
  TestValidator.predicate(
    "a capsule's half length plus radius",
    nclose(
      HumanColliders.bound({
        ...BASE,
        kind: "capsule",
        radius: 0.05,
        halfLength: 0.2,
      }).radius,
      0.25,
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a box's half diagonal",
    nclose(
      HumanColliders.bound({
        ...BASE,
        kind: "box",
        halfExtents: { x: 0.1, y: 0.2, z: 0.2 },
      }).radius,
      0.3,
      ROUNDING,
    ),
  );
  const hull: IAutoMovieMotionHumanColliders.IBall = HumanColliders.bound({
    ...BASE,
    kind: "hull",
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: 0, z: 0 },
      { x: 0, y: 0.2, z: 0 },
      { x: 0, y: 0, z: 0.2 },
    ],
  });
  TestValidator.predicate(
    "a hull's vertex mean and farthest vertex",
    vclose(hull.centre, { x: 0.05, y: 0.05, z: 0.05 }, ROUNDING) &&
      nclose(hull.radius, Math.sqrt(0.0275), ROUNDING),
  );
}
