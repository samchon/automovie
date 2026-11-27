import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  humanAidWalkGrip
} from "../../../../../packages/motions/src/lexicon/internal/humanAidWalkGrip";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { present } from "../../internal/present";
import { vclose } from "../../internal/vclose";

/** Rounding of a few quaternion rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * `humanAidWalkGrip.target` turns an aid's model grip into the world grip a
 * hand holds: the grip's point on the aid's frame moved `offset` along the grip
 * rod's own +Z, the rod's axis that +Z, the palm's normal the rod's +Y turned
 * `angle` about the rod, and the rod's radius half its aperture.
 *
 * A walker at (1, 0, 2) turned 90 degrees about +Y, its grip 0.9 m up and 0.1 m
 * along its own +Z, the rod's aperture 3 cm.
 *
 * Scenarios:
 *
 * 1. At 5 cm along the rod and a 90-degree approach: the point is (1.15, 0.9, 2),
 *    the axis +X, the normal +Z, the radius 1.5 cm.
 * 2. With no offset and no turn the point is the grip's own, (1.1, 0.9, 2), and
 *    the normal +Y.
 */
export function test_motions_lexicon_aid_walk_grip(): void {
  const world: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 2 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const grip: IAutoMovieAffordance = {
    id: "leftGrip",
    kind: "handle",
    frame: {
      translation: { x: 0, y: 0.9, z: 0.1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    aperture: 0.03,
  };

  // 1. Along the rod, turned about it.
  const along: ReturnType<typeof humanAidWalkGrip.target> =
    humanAidWalkGrip.target(grip, world, 0.05, 90);
  TestValidator.predicate(
    "the grip along and about its rod",
    vclose(along.point, { x: 1.15, y: 0.9, z: 2 }, ROUNDING) &&
      vclose(
        present("the rod's axis", along.axis),
        { x: 1, y: 0, z: 0 },
        ROUNDING,
      ) &&
      vclose(along.normal, { x: 0, y: 0, z: 1 }, ROUNDING) &&
      nclose(present("the rod's radius", along.radius), 0.015, ROUNDING),
  );

  // 2. The grip itself.
  const own: ReturnType<typeof humanAidWalkGrip.target> =
    humanAidWalkGrip.target(grip, world, 0, 0);
  TestValidator.predicate(
    "the grip's own point and normal",
    vclose(own.point, { x: 1.1, y: 0.9, z: 2 }, ROUNDING) &&
      vclose(own.normal, { x: 0, y: 1, z: 0 }, ROUNDING),
  );
}
