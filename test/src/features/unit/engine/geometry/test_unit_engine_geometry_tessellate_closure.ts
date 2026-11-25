import { compareCodeUnits, tessellate } from "@automovie/engine";
import type {
  IAutoMoviePrimitiveShape,
  IAutoMovieTessellation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The lateral segment count round primitives are tessellated at. */
const SEGMENTS: number = 16;

/**
 * `tessellate` gives every solid primitive a closed, outward-wound surface whose
 * volume is its lattice's closed form.
 *
 * Fixtures: a 0.4 x 0.6 x 0.2 box, spheres of radius 0.5 and 0.2, a cylinder and
 * a cone of radius 0.3 and height 1, a capsule of radius 0.2 and height 1, and
 * a 2 x 3 plane. A round primitive's section is the regular 16-gon of area (16
 * / 2) r^2 sin(2 pi / 16); the sphere lattice is twelve latitude bands, each a
 * 16-gon frustum. Positions weld on a 1e-9 grid (ring seams recompute cos and
 * sin of 2 pi with float error).
 *
 * Scenarios:
 *
 * 1. Every welded nondegenerate edge of each solid has exactly two triangles.
 * 2. The cylinder's volume is the 16-gon prism, the cone's a third of it, the
 *    sphere's the frustum sum, the capsule's that sum plus its 16-gon body
 *    prism, within 1e-12; every capsule vertex lies 0.2 from its axis segment.
 * 3. Every solid's volume is positive (outward winding), and every
 *    nondegenerate triangle of the solids and the plane agrees with its
 *    authored normals.
 * 4. Normals are unit; the cone's side normals carry the slant -0.3 / hypot(1,
 *    0.3) in y.
 * 5. The plane encloses zero volume.
 */
export function test_unit_engine_geometry_tessellate_closure(): void {
  const ngon = (r: number): number => (SEGMENTS / 2) * r * r * Math.sin((2 * Math.PI) / SEGMENTS);
  const sphere = (r: number): number => {
    let v: number = 0;
    for (let band: number = 0; band < 12; ++band) {
      const upper: number = (Math.PI * band) / 12;
      const lower: number = (Math.PI * (band + 1)) / 12;
      const a: number = ngon(r * Math.sin(upper));
      const b: number = ngon(r * Math.sin(lower));
      v += (r * (Math.cos(upper) - Math.cos(lower)) * (a + b + Math.sqrt(a * b))) / 3;
    }
    return v;
  };
  const volume = (t: IAutoMovieTessellation): number => {
    const p: number[] = t.positions;
    let six: number = 0;
    for (let i: number = 0; i < t.indices.length; i += 3) {
      const [a, b, c] = [3 * t.indices[i]!, 3 * t.indices[i + 1]!, 3 * t.indices[i + 2]!];
      six +=
        p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) +
        p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!) +
        p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
    }
    return six / 6;
  };
  const key = (p: number[], i: number): string =>
    [0, 1, 2].map((k: number): number => Math.round(p[3 * i + k]! * 1e9) || 0).join(",");
  const watertight = (t: IAutoMovieTessellation): boolean => {
    const counts: Map<string, number> = new Map();
    for (let i: number = 0; i < t.indices.length; i += 3) {
      const keys: string[] = [0, 1, 2].map((c: number): string => key(t.positions, t.indices[i + c]!));
      if (new Set(keys).size < 3) continue;
      for (let e: number = 0; e < 3; ++e) {
        const edge: string = [keys[e]!, keys[(e + 1) % 3]!].sort(compareCodeUnits).join("|");
        counts.set(edge, (counts.get(edge) ?? 0) + 1);
      }
    }
    return counts.size > 0 && [...counts.values()].every((n: number): boolean => n === 2);
  };
  const agrees = (t: IAutoMovieTessellation): boolean => {
    const p: number[] = t.positions;
    const n: number[] = t.normals;
    let seen: number = 0;
    for (let i: number = 0; i < t.indices.length; i += 3) {
      const [a, b, c] = [3 * t.indices[i]!, 3 * t.indices[i + 1]!, 3 * t.indices[i + 2]!];
      const u: number[] = [0, 1, 2].map((k: number): number => p[b + k]! - p[a + k]!);
      const w: number[] = [0, 1, 2].map((k: number): number => p[c + k]! - p[a + k]!);
      const g: number[] = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      if (Math.hypot(g[0]!, g[1]!, g[2]!) < 1e-12) continue;
      ++seen;
      const m: number = [0, 1, 2].reduce(
        (sum: number, k: number): number => sum + g[k]! * (n[a + k]! + n[b + k]! + n[c + k]!),
        0,
      );
      if (m <= 0) return false;
    }
    return seen > 0;
  };
  const close = (a: number, b: number, e: number): boolean => Math.abs(a - b) <= e;
  const solids: IAutoMoviePrimitiveShape[] = [
    { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
    { type: "sphere", radius: 0.5 },
    { type: "cylinder", radius: 0.3, height: 1 },
    { type: "cone", radius: 0.3, height: 1 },
    { type: "capsule", radius: 0.2, height: 1 },
  ];
  const plane: IAutoMoviePrimitiveShape = { type: "plane", width: 2, depth: 3 };

  // 1.
  for (const shape of solids)
    TestValidator.predicate(`${shape.type} watertight`, watertight(tessellate(shape)));

  // 2.
  for (const [label, shape, expected] of [
    ["cylinder", { type: "cylinder", radius: 0.3, height: 1 }, ngon(0.3)],
    ["cone", { type: "cone", radius: 0.3, height: 1 }, ngon(0.3) / 3],
    ["sphere", { type: "sphere", radius: 0.2 }, sphere(0.2)],
    ["capsule", { type: "capsule", radius: 0.2, height: 1 }, sphere(0.2) + ngon(0.2)],
  ] satisfies [string, IAutoMoviePrimitiveShape, number][])
    TestValidator.predicate(`${label} volume`, close(volume(tessellate(shape)), expected, 1e-12));
  const capsule: number[] = tessellate({ type: "capsule", radius: 0.2, height: 1 }).positions;
  TestValidator.predicate(
    "capsule swept sphere",
    Array.from({ length: capsule.length / 3 }, (_: unknown, i: number): number =>
      Math.hypot(capsule[3 * i]!, Math.max(0, Math.abs(capsule[3 * i + 1]!) - 0.5), capsule[3 * i + 2]!),
    ).every((d: number): boolean => close(d, 0.2, 1e-12)),
  );

  // 3.
  for (const shape of solids)
    TestValidator.predicate(`${shape.type} positive volume`, volume(tessellate(shape)) > 0);
  for (const shape of [...solids, plane])
    TestValidator.predicate(`${shape.type} winding`, agrees(tessellate(shape)));

  // 4.
  for (const shape of solids) {
    const n: number[] = tessellate(shape).normals;
    TestValidator.predicate(
      `${shape.type} unit normals`,
      n.length > 0 &&
        Array.from({ length: n.length / 3 }, (_: unknown, i: number): number =>
          Math.hypot(n[3 * i]!, n[3 * i + 1]!, n[3 * i + 2]!),
        ).every((l: number): boolean => close(l, 1, 1e-9)),
    );
  }
  const cone: number[] = tessellate({ type: "cone", radius: 0.3, height: 1 }).normals;
  const slant: number = -0.3 / Math.hypot(1, 0.3);
  TestValidator.predicate(
    "cone slant",
    Array.from({ length: 2 * (SEGMENTS + 1) }, (_: unknown, i: number): number => cone[3 * i + 1]!).every(
      (y: number): boolean => close(y, slant, 1e-9),
    ),
  );

  // 5.
  TestValidator.predicate("plane volume", close(volume(tessellate(plane)), 0, 1e-12));
}
