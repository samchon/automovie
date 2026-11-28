import { AutoMovieEngineText } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanColliderCorners
} from "../../../../../packages/motions/src/posture/internal/HumanColliderCorners";
import { TestValidator } from "@nestia/e2e";

/** A shape's identity and placement, its kind aside. */
const BASE: Pick<IAutoMoviePhysicalShape, "id" | "material" | "transform"> = {
  id: "s",
  material: "skin",
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
};

/** The probes as sorted strings, for a set comparison. */
function set(points: readonly IAutoMovieVector3[]): string[] {
  return points
    .map((p: IAutoMovieVector3): string => `${p.x},${p.y},${p.z}`)
    .sort(AutoMovieEngineText.compareCodeUnits);
}

/**
 * `HumanColliderCorners` is the surface probes of a collider in its own frame:
 * a box's eight corners, a sphere's two poles and four equator points, a
 * capsule's two end poles and four points on each of its two end circles and
 * its middle circle, a hull's vertices.
 *
 * Scenarios:
 *
 * 1. A box of half extents (1, 2, 3): its eight corners.
 * 2. A sphere of radius 0.5: the poles ±0.5 on Y and the four equator points.
 * 3. A capsule of radius 1/8 and half length 1/4: poles at ±3/8 m and twelve
 *    cardinal points at heights −1/4, 0 and 1/4 m. At zero half length its
 *    probes coincide with its radius-matched sphere's six probes. These
 *    dyadic coordinates and sums are exact in binary64.
 * 4. A tetrahedron hull: its four vertices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the collider probe set and exact collapse from a capsule to a radius-matched sphere.
 * @evidence contracts/development/testing.md#behavioral-verification Builds local probes for box, sphere, capsule, collapsed capsule and authored hull vertices.
 * @evidence contracts/development/testing.md#independent-expectations The dyadic capsule dimensions put poles at ±3/8 and three probe circles at −1/4, 0 and 1/4. Collapse yields exactly six distinct coordinates.
 */
export function test_motions_posture_collider_corners(): void {
  // 1. A box.
  const corners: string[] = [];
  for (const x of [-1, 1])
    for (const y of [-2, 2])
      for (const z of [-3, 3]) corners.push(`${x},${y},${z}`);
  TestValidator.equals(
    "a box's corners",
    set(
      HumanColliderCorners({
        ...BASE,
        kind: "box",
        halfExtents: { x: 1, y: 2, z: 3 },
      }),
    ),
    corners.sort(AutoMovieEngineText.compareCodeUnits),
  );

  // 2. A sphere.
  TestValidator.equals(
    "a sphere's poles and equator",
    set(HumanColliderCorners({ ...BASE, kind: "sphere", radius: 0.5 })),
    ["0,0.5,0", "0,-0.5,0", "0.5,0,0", "-0.5,0,0", "0,0,0.5", "0,0,-0.5"].sort(
      AutoMovieEngineText.compareCodeUnits,
    ),
  );

  // 3. A capsule.
  const capsule: IAutoMoviePhysicalShape = {
    ...BASE,
    kind: "capsule",
    radius: 0.125,
    halfLength: 0.25,
  };
  TestValidator.equals(
    "a capsule's two poles and twelve cardinal points",
    set(HumanColliderCorners(capsule)),
    [
      "0,0.375,0",
      "0,-0.375,0",
      ...[-0.25, 0, 0.25].flatMap((height: number): string[] => [
        `-0.125,${height},0`,
        `0.125,${height},0`,
        `0,${height},-0.125`,
        `0,${height},0.125`,
      ]),
    ].sort(AutoMovieEngineText.compareCodeUnits),
  );
  TestValidator.equals(
    "a collapsed capsule has exactly six distinct sphere probes",
    set(HumanColliderCorners({ ...capsule, halfLength: 0 })),
    [
      "0,0.125,0",
      "0,-0.125,0",
      "0.125,0,0",
      "-0.125,0,0",
      "0,0,0.125",
      "0,0,-0.125",
    ].sort(AutoMovieEngineText.compareCodeUnits),
  );

  // 4. A hull.
  const tetrahedron: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  TestValidator.equals(
    "a hull's vertices",
    set(HumanColliderCorners({ ...BASE, kind: "hull", points: tetrahedron })),
    set(tetrahedron),
  );
}
