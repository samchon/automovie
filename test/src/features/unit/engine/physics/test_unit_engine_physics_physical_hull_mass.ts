import { physicalHullFaces as H, physicalHullMass } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * Producer-owned hull reflection preserves actual support geometry and winding
 * while fresh output edited before first use receives ordinary admission.
 *
 * Scenarios:
 *
 * 1. An asymmetric2x3x4 cuboid with one coplanar face point and one interior point
 *    reflects from X=[1,3] to[-3,-1]. Its six outward planes, eight corners,
 *    centroid(-2,0.5,4), positive volume24 and unit-mass moments (13,20,25)/12
 *    follow closed forms.
 * 2. Every outward loop supports all input points and has positive winding.
 *    Repeated reflection owns fresh arrays/vectors and leaves the source
 *    unchanged; no hull result supplies expected reflected coordinates.
 * 3. Doubling reflected X coordinates before the first hull read creates a
 *    genuine4x3x4 cuboid with volume48 and centroid(-4,0.5,4). A provenance
 *    shortcut must decline this changed geometry rather than reuse old planes.
 * 4. A flat rectangle stays volumeless after reflection and mass admission still
 *    refuses instead of manufacturing a closed solid.
 * 5. Mutating a source vertex after reflection but before the first hull read
 *    cannot move the already returned independent reflected geometry.
 */
export function test_unit_engine_physics_physical_hull_mass(): void {
  const source: IAutoMovieVector3[] = [];
  for (const x of [1, 3])
    for (const y of [-1, 2]) for (const z of [2, 6]) source.push({ x, y, z });
  source.push({ x: 1, y: 0.5, z: 4 }, { x: 2, y: 0.5, z: 4 });
  const original: IAutoMovieVector3[] = source.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  const reflected: IAutoMovieVector3[] = H.mirrorX(source);
  const another: IAutoMovieVector3[] = H.mirrorX(source);
  TestValidator.predicate(
    "reflection owns fresh coordinates while preserving source geometry",
    reflected !== source &&
      reflected !== another &&
      reflected.length === source.length &&
      reflected.every(
        (point: IAutoMovieVector3, i: number): boolean =>
          point !== source[i] &&
          point !== another[i] &&
          vclose(
            point,
            { x: -original[i]!.x, y: original[i]!.y, z: original[i]!.z },
            0,
          ) &&
          vclose(source[i]!, original[i]!, 0),
      ),
  );
  const hull: H.IHull = H(reflected);
  TestValidator.predicate(
    "reflected cuboid has its analytic topology and radii",
    hull.faces.length === 6 &&
      hull.vertices.length === 8 &&
      vclose(
        hull.centre,
        { x: -2, y: 0.5, z: 4 },
        PhysicalTolerance.ROUNDING,
      ) &&
      nclose(hull.radius, Math.sqrt(7.25), PhysicalTolerance.ROUNDING) &&
      nclose(hull.depth, 1, PhysicalTolerance.ROUNDING) &&
      nclose(hull.buried, 1, PhysicalTolerance.ROUNDING),
  );
  const expected: readonly (readonly [IAutoMovieVector3, number])[] = [
    [{ x: 1, y: 0, z: 0 }, -1],
    [{ x: -1, y: 0, z: 0 }, 3],
    [{ x: 0, y: 1, z: 0 }, 2],
    [{ x: 0, y: -1, z: 0 }, 1],
    [{ x: 0, y: 0, z: 1 }, 6],
    [{ x: 0, y: 0, z: -1 }, -2],
  ];
  for (const [normal, distance] of expected)
    TestValidator.predicate(
      "each independently stated outward support plane exists exactly once",
      hull.faces.filter(
        (face: H.IFace): boolean =>
          vclose(face.normal, normal, PhysicalTolerance.ROUNDING) &&
          nclose(face.offset, distance, PhysicalTolerance.ROUNDING),
      ).length === 1,
    );
  for (const face of hull.faces) {
    const a: IAutoMovieVector3 = face.loop[0]!;
    const b: IAutoMovieVector3 = face.loop[1]!;
    const c: IAutoMovieVector3 = face.loop[2]!;
    const ab: IAutoMovieVector3 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const bc: IAutoMovieVector3 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const orientation: number =
      (ab.y * bc.z - ab.z * bc.y) * face.normal.x +
      (ab.z * bc.x - ab.x * bc.z) * face.normal.y +
      (ab.x * bc.y - ab.y * bc.x) * face.normal.z;
    TestValidator.predicate(
      "actual reflected loops retain outward winding and full support",
      face.loop.length === 4 &&
        orientation > 0 &&
        face.loop.every((point: IAutoMovieVector3): boolean =>
          reflected.includes(point),
        ) &&
        reflected.every(
          (point: IAutoMovieVector3): boolean =>
            face.normal.x * point.x +
              face.normal.y * point.y +
              face.normal.z * point.z <=
            face.offset + PhysicalTolerance.ROUNDING,
        ),
    );
  }
  mass(
    reflected,
    24,
    { x: -2, y: 0.5, z: 4 },
    { x: 13 / 12, y: 20 / 12, z: 25 / 12 },
  );

  for (const point of another) point.x *= 2;
  const edited: H.IHull = H(another);
  TestValidator.predicate(
    "changed issued coordinates receive their actual new hull",
    edited.faces.length === 6 &&
      edited.vertices.length === 8 &&
      vclose(
        edited.centre,
        { x: -4, y: 0.5, z: 4 },
        PhysicalTolerance.ROUNDING,
      ) &&
      nclose(edited.depth, 1.5, PhysicalTolerance.ROUNDING),
  );
  mass(
    another,
    48,
    { x: -4, y: 0.5, z: 4 },
    { x: 25 / 12, y: 25 / 12, z: 32 / 12 },
  );
  const restored: IAutoMovieVector3[] = H.mirrorX(source);
  mass(
    restored,
    24,
    { x: -2, y: 0.5, z: 4 },
    { x: 13 / 12, y: 20 / 12, z: 25 / 12 },
  );
  TestValidator.predicate(
    "edited reflected output never changes the source's next reflection",
    source.every((point: IAutoMovieVector3, i: number): boolean =>
      vclose(point, original[i]!, 0),
    ),
  );
  const changedSource: IAutoMovieVector3[] = original.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  const independent: IAutoMovieVector3[] = H.mirrorX(changedSource);
  changedSource[0]!.x = -100;
  TestValidator.predicate(
    "source changes cannot move an already returned unread reflection",
    independent.every((point: IAutoMovieVector3, i: number): boolean =>
      vclose(
        point,
        { x: -original[i]!.x, y: original[i]!.y, z: original[i]!.z },
        0,
      ),
    ),
  );
  mass(
    independent,
    24,
    { x: -2, y: 0.5, z: 4 },
    { x: 13 / 12, y: 20 / 12, z: 25 / 12 },
  );
  const flat: IAutoMovieVector3[] = H.mirrorX([
    { x: 1, y: -1, z: 0 },
    { x: 3, y: -1, z: 0 },
    { x: 3, y: 2, z: 0 },
    { x: 1, y: 2, z: 0 },
    { x: 2, y: 0.5, z: 0 },
  ]);
  TestValidator.equals(
    "reflected flat points gain no fictitious face",
    H(flat).faces,
    [],
  );
  TestValidator.predicate(
    "reflected flat points keep the original mass refusal",
    throwsError(
      (): ReturnType<typeof physicalHullMass> => physicalHullMass(flat),
      "volume",
    ),
  );
}

/**
 * Check positive solid integration against independently known cuboid mass
 * properties.
 */
function mass(
  points: readonly IAutoMovieVector3[],
  volume: number,
  centre: IAutoMovieVector3,
  inertia: IAutoMovieVector3,
): void {
  const actual: ReturnType<typeof physicalHullMass> = physicalHullMass(points);
  TestValidator.predicate(
    "reflected geometry retains its actual analytic mass properties",
    actual.volume > 0 &&
      nclose(actual.volume, volume, PhysicalTolerance.ROUNDING) &&
      vclose(actual.centerOfMass, centre, PhysicalTolerance.ROUNDING) &&
      vclose(actual.inertia, inertia, PhysicalTolerance.ROUNDING),
  );
}
