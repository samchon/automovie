import { tessellate } from "@automovie/engine";
import { AutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The lateral segment count the engine tessellates round primitives at.
 */
const SEGMENTS: number = 16;

/**
 * Area of the regular n-gon cross-section the round lattices approximate.
 */
const ngonArea: (radius: number) => number = (radius: number): number =>
  (SEGMENTS / 2) * radius * radius * Math.sin((2 * Math.PI) / SEGMENTS);

/**
 * Quantized position key: ring seams recompute `cos/sin(2π)` with float error (~1e-16), so raw component equality would split one seam vertex into two. A 1e-9 grid welds those while keeping distinct vertices apart (`|| 0` folds the −0 a tiny negative rounds to).
 */
const keyAt: (positions: number[], index: number) => string = (
  positions: number[],
  index: number,
): string =>
  [0, 1, 2]
    .map(
      (axis: number): number =>
        Math.round(positions[index * 3 + axis]! * 1e9) || 0,
    )
    .join(",");

/**
 * Every undirected nondegenerate edge must have two incident triangles after position welding; this checks closed edge incidence, not single-fan vertex links or orientation. Repeated welded corners at sphere poles and cone apices carry no surface and are skipped.
 */
const isWatertight: (t: {
  positions: number[];
  indices: number[];
}) => boolean = (t: { positions: number[]; indices: number[] }): boolean => {
  const counts: Map<string, number> = new Map<string, number>();
  for (let i: number = 0; i < t.indices.length; i += 3) {
    const keys: string[] = [0, 1, 2].map((corner: number): string =>
      keyAt(t.positions, t.indices[i + corner]!),
    );
    if (new Set(keys).size < 3) continue; // degenerate: no surface, no edges
    for (let e: number = 0; e < 3; ++e) {
      const edge: string = [keys[e]!, keys[(e + 1) % 3]!]
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join("|");
      counts.set(edge, (counts.get(edge) ?? 0) + 1);
    }
  }
  for (const count of counts.values()) if (count !== 2) return false;
  return counts.size > 0;
};

/**
 * Signed volume via the divergence theorem, exact for a closed polyhedron.
 */
const signedVolume: (t: {
  positions: number[];
  indices: number[];
}) => number = (t: { positions: number[]; indices: number[] }): number => {
  let six: number = 0;
  const p: number[] = t.positions;
  for (let i: number = 0; i < t.indices.length; i += 3) {
    const a: number = t.indices[i]! * 3;
    const b: number = t.indices[i + 1]! * 3;
    const c: number = t.indices[i + 2]! * 3;
    six +=
      p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) +
      p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!) +
      p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
  }
  return six / 6;
};

/**
 * Solid tessellations satisfy independent edge-incidence, closed-volume and surface expectations, including the capsule's rounded ends and cylindrical body.
 *
 * Scenarios:
 * 1. Every welded nondegenerate edge of box, sphere, cylinder, cone and capsule has exactly two incident triangles.
 * 2. Prism/pyramid volumes follow the regular n-gon cross-section; capsule volume combines independent latitude-frustum sphere volume with its central prism, and every capsule vertex lies on its swept-sphere surface.
 * 3. Normals have unit length and cone side normals carry the analytic slant component.
 * 4. The plane remains a zero-volume negative twin; volume alone is not proof of a closed surface.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls all solid tessellations and checks welded edge incidence, signed volumes, unit normals and cone slant; capsule volume and swept-sphere surface checks reject substituting a bounding cylinder for its rounded ends.
 * @evidence contracts/testing.md#independent-expectations Edge incidence follows closed triangle surfaces; n-gon prism/pyramid geometry and latitude-frustum integration give independent volumes, while distance to the finite capsule axis gives its swept-sphere surface. Position welding is limited to this fixed scale and 1e-9 grid.
 * @evidence contracts/testing.md#distinguishing-cases Box, sphere, cylinder, cone and capsule are contrasted with the zero-volume plane; volume and edge checks work together because either alone can miss malformed surfaces. Visual inspection and arbitrary-scale welding are outside this numerical unit.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_tessellate_watertight entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_tessellate_watertight(): void {
  const solids: AutoMoviePrimitiveShape[] = [
    { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
    { type: "sphere", radius: 0.5 },
    { type: "cylinder", radius: 0.3, height: 1 },
    { type: "cone", radius: 0.3, height: 1 },
    { type: "capsule", radius: 0.2, height: 1 },
  ];
  for (const shape of solids)
    TestValidator.predicate(
      `${shape.type}: watertight (every edge shared by exactly two triangles)`,
      isWatertight(tessellate(shape)),
    );

  TestValidator.predicate(
    "cylinder volume equals the analytic n-gon prism",
    nclose(
      signedVolume(tessellate({ type: "cylinder", radius: 0.3, height: 1 })),
      ngonArea(0.3) * 1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "cone volume equals the analytic n-gon pyramid",
    nclose(
      signedVolume(tessellate({ type: "cone", radius: 0.3, height: 1 })),
      (ngonArea(0.3) * 1) / 3,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "sphere volume equals the independent latitude-frustum integration",
    nclose(
      signedVolume(tessellate({ type: "sphere", radius: 0.2 })),
      sphereLatticeVolume(0.2),
      1e-12,
    ),
  );
  TestValidator.predicate(
    "capsule volume is the same-radius sphere lattice plus its n-gon body prism",
    nclose(
      signedVolume(tessellate({ type: "capsule", radius: 0.2, height: 1 })),
      sphereLatticeVolume(0.2) + ngonArea(0.2) * 1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "capsule ends are hemispheres: every vertex lies on the swept sphere",
    ((): boolean => {
      const p: number[] = tessellate({
        type: "capsule",
        radius: 0.2,
        height: 1,
      }).positions;
      return Array.from(
        { length: p.length / 3 },
        (_: unknown, i: number): number =>
          Math.hypot(
            p[i * 3]!,
            Math.max(0, Math.abs(p[i * 3 + 1]!) - 0.5),
            p[i * 3 + 2]!,
          ),
      ).every((distance: number): boolean => nclose(distance, 0.2, 1e-12));
    })(),
  );

  for (const shape of solids) {
    const t: import("@automovie/engine").ITessellation = tessellate(shape);
    TestValidator.predicate(
      `${shape.type}: normals are unit length`,
      t.normals.length > 0 &&
        t.normals.length === t.positions.length &&
        t.normals.length % 3 === 0 &&
        Array.from(
          { length: t.normals.length / 3 },
          (_: unknown, i: number): number =>
            Math.hypot(
              t.normals[i * 3]!,
              t.normals[i * 3 + 1]!,
              t.normals[i * 3 + 2]!,
            ),
        ).every((length: number): boolean => nclose(length, 1, 1e-9)),
    );
  }
  const cone: import("@automovie/engine").ITessellation = tessellate({
    type: "cone",
    radius: 0.3,
    height: 1,
  });
  const slantY: number = (0 - 0.3) / Math.hypot(1, 0.3);
  const sideVertexCount: number = 2 * (SEGMENTS + 1); // ring pairs before the base cap
  TestValidator.predicate(
    "cone side normals ride the slant, not the horizontal ring",
    Array.from(
      { length: sideVertexCount },
      (_: unknown, i: number): number => cone.normals[i * 3 + 1]!,
    ).every((ny: number): boolean => nclose(ny, slantY, 1e-9)),
  );

  const plane: import("@automovie/engine").ITessellation = tessellate({
    type: "plane",
    width: 2,
    depth: 3,
  });
  TestValidator.predicate(
    "the plane stays a degenerate zero-volume solid",
    nclose(signedVolume(plane), 0, 1e-12),
  );
}

/**
 * Integrate twelve authored latitude bands as regular sixteen-gon frusta; this geometric reference reads no tessellation output.
 */
function sphereLatticeVolume(radius: number): number {
  let volume: number = 0;
  for (let band: number = 0; band < 12; ++band) {
    const upper: number = (Math.PI * band) / 12;
    const lower: number = (Math.PI * (band + 1)) / 12;
    const upperArea: number = ngonArea(radius * Math.sin(upper));
    const lowerArea: number = ngonArea(radius * Math.sin(lower));
    const height: number = radius * (Math.cos(upper) - Math.cos(lower));
    volume +=
      (height * (upperArea + lowerArea + Math.sqrt(upperArea * lowerArea))) / 3;
  }
  return volume;
}
