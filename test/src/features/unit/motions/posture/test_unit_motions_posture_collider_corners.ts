import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanColliderCorners } from "@automovie/motions/internal";
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
    .sort();
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
 * 3. A capsule of radius 0.1 and half length 0.2: the poles ±0.3 and twelve circle
 *    points at heights −0.2, 0 and 0.2.
 */
export function test_unit_motions_posture_collider_corners(): void {
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
    corners.sort(),
  );

  // 2. A sphere.
  TestValidator.equals(
    "a sphere's poles and equator",
    set(HumanColliderCorners({ ...BASE, kind: "sphere", radius: 0.5 })),
    [
      "0,0.5,0",
      "0,-0.5,0",
      "0.5,0,0",
      "-0.5,0,0",
      "0,0,0.5",
      "0,0,-0.5",
    ].sort(),
  );

  // 3. A capsule.
  const capsule: readonly IAutoMovieVector3[] = HumanColliderCorners({
    ...BASE,
    kind: "capsule",
    radius: 0.1,
    halfLength: 0.2,
  });
  TestValidator.predicate(
    "a capsule's poles and three circles",
    capsule.length === 14 &&
      capsule.some(
        (p: IAutoMovieVector3): boolean => Math.abs(p.y - 0.3) < 1e-12,
      ) &&
      capsule.some(
        (p: IAutoMovieVector3): boolean => Math.abs(p.y + 0.3) < 1e-12,
      ) &&
      [-0.2, 0, 0.2].every(
        (h: number): boolean =>
          capsule.filter(
            (p: IAutoMovieVector3): boolean =>
              p.y === h && Math.abs(Math.hypot(p.x, p.z) - 0.1) < 1e-12,
          ).length === 4,
      ),
  );
}
