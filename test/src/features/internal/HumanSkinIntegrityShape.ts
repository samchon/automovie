import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import type { HumanSkinIntegrityBvh } from "./HumanSkinIntegrityBvh";
import { HumanSkinIntegrityPredicate as Predicate } from "./HumanSkinIntegrityPredicate";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * The shape and facing of single triangles: whether a triangle has an area a
 * renderer can draw, and whether a sheet of them faces out of the body.
 */
export namespace HumanSkinIntegrityShape {
  /**
   * What a triangle is against the arithmetic it is computed and drawn in:
   * `fine`; `zero`, the cross product of its edges lying within its rounding
   * error so it has no plane and no normal; or `needle`, its least altitude
   * within twice the displacement single-precision rounding gives a vertex, so
   * the triangle a renderer draws may lose its area or turn over.
   */
  export type Class = "fine" | "zero" | "needle";

  /** Unit roundoff of a single-precision float, the precision a renderer draws in. */
  const EPSILON32: number = 2 ** -24;

  /** The shape class of one triangle. */
  export function classify(mesh: HumanSkinIntegrity.IMesh, t: number): Class {
    const a: Vec.V3 = Vec.at(mesh.P, mesh.I[3 * t]!);
    const b: Vec.V3 = Vec.at(mesh.P, mesh.I[3 * t + 1]!);
    const c: Vec.V3 = Vec.at(mesh.P, mesh.I[3 * t + 2]!);
    const u: Vec.V3 = Vec.sub(b, a);
    const v: Vec.V3 = Vec.sub(c, a);
    const w: Vec.V3 = Vec.sub(c, b);
    const area2: number = Math.hypot(...Vec.cross(u, v));
    const lu: number = Math.hypot(...u);
    const lv: number = Math.hypot(...v);
    const lw: number = Math.hypot(...w);

    // Each cross-product component is two rounded products of rounded
    // differences, each within a few roundoffs of |u||v|.
    if (area2 <= 8 * Predicate.EPSILON * lu * lv || area2 === 0) return "zero";

    // The least altitude is the area over the longest edge.
    const altitude: number = area2 / Math.max(lu, lv, lw);
    const largest: number = Math.max(...a.map(Math.abs), ...b.map(Math.abs), ...c.map(Math.abs));

    // Rounding each coordinate to single precision moves a vertex by at most
    // sqrt(3) half-units in the last place of the largest coordinate.
    const shift: number = Math.sqrt(3) * EPSILON32 * largest;

    return altitude <= 2 * shift ? "needle" : "fine";
  }

  /** The area of every triangle, mm². */
  export function areas(mesh: HumanSkinIntegrity.IMesh): Float64Array {
    const T: number = mesh.I.length / 3;
    const out: Float64Array = new Float64Array(T);

    for (let t: number = 0; t < T; t++)
      out[t] = 0.5 * Math.hypot(...Vec.normal(mesh.P, mesh.I[3 * t]!, mesh.I[3 * t + 1]!, mesh.I[3 * t + 2]!));

    return out;
  }

  /**
   * Whether a consistently wound patch faces into the body: a ray along each
   * sampled triangle's normal from its centroid crosses the skin an odd number
   * of times. Up to 15 triangles are sampled across the patch and the majority
   * decides, so a ray through an opening or along an edge cannot.
   */
  export function inward(
    mesh: HumanSkinIntegrity.IMesh,
    bvh: HumanSkinIntegrityBvh,
    areas: Float64Array,
    patch: number[],
  ): boolean {
    const usable: number[] = patch.filter((t: number): boolean => areas[t]! > 0);

    if (!usable.length) return false;

    const samples: number = Math.min(15, usable.length);
    let odd: number = 0;

    for (let s: number = 0; s < samples; s++) {
      // The sampled triangle, its unit normal and its centroid, where the ray starts.
      const t: number = usable[Math.floor(((s + 0.5) * usable.length) / samples)]!;
      const a: number = mesh.I[3 * t]!;
      const b: number = mesh.I[3 * t + 1]!;
      const c: number = mesh.I[3 * t + 2]!;
      const raw: Vec.V3 = Vec.normal(mesh.P, a, b, c);
      const length: number = Math.hypot(...raw);
      const direction: Vec.V3 = [raw[0] / length, raw[1] / length, raw[2] / length];
      const origin: Vec.V3 = Vec.centroid(mesh, t);

      // An outward-facing triangle sees an even number of crossings on the way out.
      if (bvh.hits(mesh, origin, direction, t) % 2 === 1) odd++;
    }

    return 2 * odd > samples;
  }
}
