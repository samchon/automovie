import { type AutoMovieEnginePhysicsGjkTypes, AutoMovieEnginePhysics } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanLinkCertificate
} from "../../../../../packages/motions/src/posture/internal/HumanLinkCertificate";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a sphere pair's distance, metres. */
const ROUNDING: number = 1e-12;

/** A pose at a place, unturned. */
function at(position: IAutoMovieVector3): IAutoMovieRigidTransform {
  return { position, rotation: { x: 0, y: 0, z: 0, w: 1 } };
}

/** A sphere at the segment's origin. */
function sphere(id: string, radius: number): IAutoMoviePhysicalShape {
  return {
    id,
    material: "skin",
    kind: "sphere",
    radius,
    transform: at({ x: 0, y: 0, z: 0 }),
  };
}

/** A tangle model's part with its probes' offset. */
function part(offset: number): IAutoMovieMotionHumanAuditTangleModel.IPart {
  return {
    bone: "head",
    shapes: [],
    probes: [],
    surface: 0,
    centre: { x: 0, y: 0, z: 0 },
    radius: 0,
    extent: 0,
    offset,
  };
}

/**
 * `HumanLinkCertificate` bounds how deep a segment's probes can lie in a convex
 * shape by the two solids' signed distance: `certify` is the least distance
 * from the segment's solids to the shape less the probes' offset, stopping once
 * it is below the caller's floor; `clearance` is the least distance between two
 * placed segments' shapes less the larger of their parts' offsets, negative
 * infinity where their cores meet. Two spheres' signed distance is their
 * centres' less their radii, which GJK reads exactly on point cores.
 *
 * Scenarios:
 *
 * 1. Spheres of radii 0.1 and 0.2 at centres 1 m apart, offset 0.05: 0.65; with a
 *    second, nearer solid 0.5 m away the least, 0.15.
 * 2. Two placed segments of those spheres, offsets 0.05 and 0.08: 0.62; at centres
 *    0.2 m apart, overlapping by 0.1, −0.18; at one centre, negative infinity.
 */
export function test_motions_posture_link_certificate(): void {
  const a: AutoMovieEnginePhysicsGjkTypes.ISolid = AutoMovieEnginePhysics.physicalShapeGjkSolid(
    at({ x: 0, y: 0, z: 0 }),
    sphere("a", 0.1),
  );
  const near: AutoMovieEnginePhysicsGjkTypes.ISolid = AutoMovieEnginePhysics.physicalShapeGjkSolid(
    at({ x: 0.5, y: 0, z: 0 }),
    sphere("n", 0.1),
  );
  const b: AutoMovieEnginePhysicsGjkTypes.ISolid = AutoMovieEnginePhysics.physicalShapeGjkSolid(
    at({ x: 1, y: 0, z: 0 }),
    sphere("b", 0.2),
  );

  // 1. Certify.
  TestValidator.predicate(
    "the least distance less the offset",
    nclose(
      HumanLinkCertificate.certify([a], 0.05, b, -Infinity),
      0.65,
      ROUNDING,
    ) &&
      nclose(
        HumanLinkCertificate.certify([a, near], 0.05, b, -Infinity),
        0.15,
        ROUNDING,
      ),
  );

  // 2. Clearance.
  const placed = (
    x: number,
    radius: number,
  ): IAutoMovieMotionHumanColliders.IPlaced => ({
    bone: "head",
    pose: at({ x, y: 0, z: 0 }),
    shapes: [sphere("s", radius)],
  });
  TestValidator.predicate(
    "two segments' clearance",
    nclose(
      HumanLinkCertificate.clearance(
        placed(0, 0.1),
        part(0.05),
        placed(1, 0.2),
        part(0.08),
      ),
      0.62,
      ROUNDING,
    ) &&
      nclose(
        HumanLinkCertificate.clearance(
          placed(0, 0.1),
          part(0.05),
          placed(0.2, 0.2),
          part(0.08),
        ),
        -0.18,
        ROUNDING,
      ) &&
      HumanLinkCertificate.clearance(
        placed(0, 0.1),
        part(0.05),
        placed(0, 0.2),
        part(0.08),
      ) === -Infinity,
  );
}
