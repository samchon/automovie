import { tessellate } from "@automovie/engine";
import { AutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Origin-centered shapes whose tessellation encloses a positive volume.
 */
const SOLIDS: AutoMoviePrimitiveShape[] = [
  { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
  { type: "sphere", radius: 0.5 },
  { type: "cylinder", radius: 0.3, height: 1 },
  { type: "cone", radius: 0.3, height: 1 },
  { type: "capsule", radius: 0.2, height: 1 },
];

/**
 * Signed volume follows the divergence theorem; positive flux agrees with outward counter-clockwise winding on a closed surface and does not alone prove closed topology or displayed culling.
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
 * Every triangle's geometric (winding) normal must agree with its authored vertex normals: a per-triangle check that catches local flips a global volume cannot. Zero-area triangles (a cone apex ring, a plane's collapsed sides) carry no orientation and are skipped.
 */
const windingAgreesWithNormals: (t: {
  positions: number[];
  normals: number[];
  indices: number[];
}) => boolean = (t: {
  positions: number[];
  normals: number[];
  indices: number[];
}): boolean => {
  const p: number[] = t.positions;
  const n: number[] = t.normals;
  if (
    p.length === 0 ||
    p.length % 3 !== 0 ||
    n.length !== p.length ||
    t.indices.length === 0 ||
    t.indices.length % 3 !== 0 ||
    !p.every(Number.isFinite) ||
    !n.every(Number.isFinite)
  )
    return false;
  if (
    !t.indices.every(
      (index: number): boolean =>
        Number.isInteger(index) && index >= 0 && 3 * (index + 1) <= p.length,
    )
  )
    return false;
  let observed: number = 0;
  for (let i: number = 0; i < t.indices.length; i += 3) {
    const a: number = t.indices[i]! * 3;
    const b: number = t.indices[i + 1]! * 3;
    const c: number = t.indices[i + 2]! * 3;
    const abx: number = p[b]! - p[a]!;
    const aby: number = p[b + 1]! - p[a + 1]!;
    const abz: number = p[b + 2]! - p[a + 2]!;
    const acx: number = p[c]! - p[a]!;
    const acy: number = p[c + 1]! - p[a + 1]!;
    const acz: number = p[c + 2]! - p[a + 2]!;
    const gx: number = aby * acz - abz * acy;
    const gy: number = abz * acx - abx * acz;
    const gz: number = abx * acy - aby * acx;
    if (Math.hypot(gx, gy, gz) < 1e-12) continue;
    ++observed;
    const mx: number = n[a]! + n[b]! + n[c]!;
    const my: number = n[a + 1]! + n[b + 1]! + n[c + 1]!;
    const mz: number = n[a + 2]! + n[b + 2]! + n[c + 2]!;
    if (gx * mx + gy * my + gz * mz <= 0) return false;
  }
  return observed > 0;
};

/**
 * Primitive triangles retain outward numerical orientation under the glTF counter-clockwise front-face convention.
 *
 * Scenarios:
 * 1. Every solid has strictly positive oriented volume.
 * 2. Every nondegenerate triangle across all six primitive kinds agrees with its authored normal; visual culling requires separate real-renderer observation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls primitive tessellation and checks positive oriented volume plus agreement between geometric triangle normals and authored normals; global or local winding reversals fail.
 * @evidence contracts/testing.md#independent-expectations The divergence theorem and triangle cross products derive orientation independently of the producer's index construction; degenerate triangles have no orientation and are skipped.
 * @evidence contracts/testing.md#distinguishing-cases All five solids receive global checks and all six primitive kinds receive local checks; closed topology and capsule shape belong to the watertight unit, while these signs alone do not prove visible rendering.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_tessellate_winding entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_tessellate_winding(): void {
  for (const shape of SOLIDS)
    TestValidator.predicate(
      `${shape.type}: signed volume is positive`,
      signedVolume(tessellate(shape)) > 0,
    );
  for (const shape of [
    ...SOLIDS,
    { type: "plane", width: 2, depth: 3 } as AutoMoviePrimitiveShape,
  ])
    TestValidator.predicate(
      `${shape.type}: winding agrees with authored normals`,
      windingAgreesWithNormals(tessellate(shape)),
    );
}
