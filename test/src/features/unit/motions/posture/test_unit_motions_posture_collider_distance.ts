import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanColliderDistance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of one sphere's placement and distance, metres. */
const ROUNDING: number = 1e-12;

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A segment placed by a pose, carrying one sphere at a local offset. */
function sphere(
  bone: AutoMovieHumanoidBone,
  position: IAutoMovieVector3,
  turn: number,
  offset: IAutoMovieVector3,
  radius: number,
): IAutoMovieMotionHumanColliders.IPlaced {
  return {
    bone,
    pose: {
      position,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, turn),
    },
    shapes: [
      {
        id: "ball",
        material: "skin",
        transform: { position: offset, rotation: IDENTITY },
        kind: "sphere",
        radius,
      },
    ],
  };
}

/**
 * `HumanColliderDistance` reduces a posed body's colliders to one signed
 * distance from a segment: the least over every shape, each placed by its
 * segment's pose and its own bone-local transform, negative inside, with the
 * bone it was measured to; the first strict minimum wins, and a shape whose
 * bounding sphere lies beyond the best found is passed over, which cannot
 * change it. A taper widens the segment by its radius.
 *
 * A head sphere of 0.1 m at the origin; a chest sphere of 0.2 m 0.2 m up its
 * segment's Y, the segment at (1, 0, 0) turned 90 degrees about +Z, so the
 * sphere's centre is at (0.8, 0, 0).
 *
 * Scenarios:
 *
 * 1. From (0.45, 0, 0) the chest is nearest, 0.15 m: its placement composed.
 * 2. From (0, 0, 0.05) the head, −0.05 m: inside it.
 * 3. From the segment (0, 0.5, 0) to (0.8, 0.5, 0) the chest, 0.3 m, and widened
 *    by 0.05 m at both ends, 0.25 m.
 * 4. Two equal spheres at the origin, the head's first: the head, the first strict
 *    minimum.
 * 5. The prepared reader, its spheres and readers kept across queries, gives every
 *    one-shot answer.
 * 6. A body without colliders has no distance.
 */
export function test_unit_motions_posture_collider_distance(): void {
  const body: IAutoMovieMotionHumanColliders.IPlaced[] = [
    sphere("head", { x: 0, y: 0, z: 0 }, 0, { x: 0, y: 0, z: 0 }, 0.1),
    sphere("chest", { x: 1, y: 0, z: 0 }, 90, { x: 0, y: 0.2, z: 0 }, 0.2),
  ];
  const at = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3 = a,
    taper?: readonly [number, number],
  ): IAutoMovieMotionHumanColliders.IDistance =>
    HumanColliderDistance(
      body,
      a,
      b,
      taper,
      taper === undefined ? 0 : Math.max(...taper),
    );
  const is = (
    found: IAutoMovieMotionHumanColliders.IDistance,
    distance: number,
    bone: AutoMovieHumanoidBone,
  ): boolean =>
    nclose(found.distance, distance, ROUNDING) && found.bone === bone;

  // 1. The placed chest.
  TestValidator.predicate(
    "the placed chest is nearest",
    is(at({ x: 0.45, y: 0, z: 0 }), 0.15, "chest"),
  );

  // 2. Inside the head.
  TestValidator.predicate(
    "inside the head",
    is(at({ x: 0, y: 0, z: 0.05 }), -0.05, "head"),
  );

  // 3. A segment, bare and widened.
  const a: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0 };
  const b: IAutoMovieVector3 = { x: 0.8, y: 0.5, z: 0 };
  TestValidator.predicate(
    "a segment and its taper",
    is(at(a, b), 0.3, "chest") && is(at(a, b, [0.05, 0.05]), 0.25, "chest"),
  );

  // 4. A tie.
  const twins: IAutoMovieMotionHumanColliders.IPlaced[] = [
    sphere("head", { x: 0, y: 0, z: 0 }, 0, { x: 0, y: 0, z: 0 }, 0.1),
    sphere("neck", { x: 0, y: 0, z: 0 }, 0, { x: 0, y: 0, z: 0 }, 0.1),
  ];
  TestValidator.equals(
    "the first strict minimum",
    HumanColliderDistance(twins, b, b, undefined, 0).bone,
    "head",
  );

  // 5. The prepared reader.
  const read: ReturnType<typeof HumanColliderDistance.prepare> =
    HumanColliderDistance.prepare(body);
  TestValidator.predicate(
    "the prepared reader agrees",
    [
      [
        { x: 0.45, y: 0, z: 0 },
        { x: 0.45, y: 0, z: 0 },
      ],
      [
        { x: 0, y: 0, z: 0.05 },
        { x: 0, y: 0, z: 0.05 },
      ],
      [a, b],
    ].every(([p, q]: IAutoMovieVector3[]): boolean => {
      const one: IAutoMovieMotionHumanColliders.IDistance = at(p!, q!);
      const kept: IAutoMovieMotionHumanColliders.IDistance = read(p!, q!);
      return one.distance === kept.distance && one.bone === kept.bone;
    }) && read(a, b, [0.05, 0.05]).distance === at(a, b, [0.05, 0.05]).distance,
  );

  // 6. No colliders.
  TestValidator.predicate(
    "no colliders, no distance",
    throwsError(
      (): IAutoMovieMotionHumanColliders.IDistance =>
        HumanColliderDistance([], a, b, undefined, 0),
      "A body without colliders has no distance",
    ),
  );
}
